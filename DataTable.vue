<!-- 
	Vue Datatable 
	Description: Vue Component for datatable with search, sorting, editing and pagination
	Author: Antonio Okoro 
	Version: 1.1.0 
-->
<template>
	<div class="data-table">
		<div class="data-table-loading" v-if="loading || ajaxLoading">
			<div class="data-table-loading-spinner"></div>
			<div class="data-table-loading-text">Loading Data</div>
		</div>
		<div class="data-table-inner" v-else>
			<div class="row data-table-control" v-if="header">
				<div class="col-md-6" v-if="limitable">
					<div class="form-group">
						<label>
							Show 
							<select  class="custom-select custom-select-sm" v-model.number="itemsPerPage">
								<option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
							</select> 
							rows
						</label>
					</div>
				</div>
				<div class="col-md-6" v-if="searchable">
					<div class="form-group">
						<input type="text" class="form-control form-control-sm" placeholder="Search Records" v-model="query">
					</div>
				</div>
				<div class="col-auto ml-auto" v-if="showFilters">
					Filters: 
					<div class="table-filters d-inline-block">
						<div class="table-filter" v-for="option in filters" @click="filter(option)">
							<span>{{ option.title }}</span>
						</div>
					</div>
				</div>
			</div>
			<div class="table-responsive">
				<table class="table" :class="{straight: !breakWords, 'table-hover': !!onClick}">
					<thead>
						<tr>
							<!-- Display Checkboxes If Requested -->
							<th v-if="selectable">
								<label class="custom-control custom-checkbox">
									<input type="checkbox" class="custom-control-input" :checked="allSelected" @change="selectAll">
									<span class="custom-control-label"></span>
								</label>
							</th>

							<!-- Display Index If Requested -->
							<th
								v-if="index" @click="sortIndex()"
								class="sortable"
								:class="{sort: sortColumn == '#', 'asc': sortColumn == '#' && asc, 'desc': sortColumn == '#' && !asc}"
							>#</th>
							<!-- Display All Parsed Headers -->
							<th 
								v-bind:key="th.name"
								v-for="th in headers"
								@click="sort(th.name)" 
								class="sortable"
								:class="{sort: sortColumn == th.name, 'asc': sortColumn == th.name && asc, 'desc': sortColumn == th.name && !asc}"
								v-if="th.show"
							>{{ th.th }}</th>
							<!-- Display Actions If Provided -->
							<th v-if="actions.length">Actions</th>
						</tr>
					</thead>
					<tbody v-if="paginatedItems.length">
						<!-- Loop Through All Parsed and Paginated Items -->
						<tr v-bind:key="item.index" v-for="(item, i) in paginatedItems" :class="{clickable: !!onClick}">

							<!-- Display Checkboxes If Requested -->
							<th v-if="selectable">
								<div class="custom-control custom-checkbox" @click="select(item)">
									<input type="checkbox" class="custom-control-input" :checked="item.selected">
									<span class="custom-control-label"></span>
								</div>
							</th>

							<!-- Display Index If Requested -->
							<td v-if="index">{{ item.index + 1 }}</td>

							<!-- Display All Parsed Values -->
							<td v-bind:key="j" v-for="(td, j) in item.details" @click="click(item.row, td.value, td.name, i), columnClick(td.click, item.row, td.value, td.name, i)" v-if="td.show">
								<!-- <component :is="i+'Component'" v-if="value.render"></component> -->
								<span v-if="td.html" v-html="td.rendered != null ? td.rendered : '----'"></span>
								<span v-else>{{ td.rendered != null ? td.rendered : '----' }}</span>
							</td>
							
							<!-- Diplay Actions If Provided -->
							<td v-if="item.buttons.length">
								<!-- Loop Through All Provided Actions -->
								<button 
									type="button" 
									class="btn" 
									:class="`btn-${button.color} btn-${button.size}`" 
									v-bind:key="j" 
									v-for="(button, j) in item.buttons" 
									@click="button.action(item.row, item.index)"
									v-if="button.show"
									:disabled="button.disabled"
								>
									{{ button.text }}
								</button>
							</td>
						</tr>
					</tbody>
					<tbody v-else>
						<!-- Display Empty Message If No Items Are Rendered -->
						<tr>
							<td align="center" :colspan="headers.filter(h => h.show).length + (actions.length ? 1 : 0) + (index ? 1 : 0) + (selectable ? 1 : 0)">No results</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="row" v-if="footer">
				<div class="col-md-6" v-if="pageDetails">
					<div class="showing">
						Showing 
						<!-- Current Page Starting Index -->
						{{ paginatedItems.length ? (itemsPerPage * (currentPage - 1)) + 1 : 0 }} 
						to 
						<!-- Current Page End Index -->
						{{ (itemsPerPage * (currentPage -1 )) + paginatedItems.length }}  
						of 
						<!-- All Items Provided -->
						{{ renderedItems.length }} items
					</div>
				</div>
				<div class="col-md-6" v-if="paginatable">
					<ul class="pagination" v-if="paginateLinks.length">
						<li class="page-item" v-if="pages && currentPage != 1">
							<span class="page-link" @click="prev">Prev</span>
						</li>
						<li class="page-item" v-bind:key="item.page" v-for="item in paginateLinks" :class="{active: currentPage == item.page}">
							<span class="page-link" @click="paginate(item.page)">{{ item.page }}</span>
						</li>
						<li class="page-item" v-if="pages && currentPage < pages">
							<span class="page-link" @click="next">Next</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import toastr from "toastr";
import Axios from "axios";
export default {
	data() {
		return {
			// Items TO Display For Each Paginated Page
			itemsPerPage: this.perPage,
			// Current Page Number In Pagination
			currentPage: 1,
			// Current Page Items
			paginatedItems: [],
			// Sort Order (true = ascending)
			asc: this.sortOrder !== 'desc',
			// All Mapped Rows, Before Search And Filters
			allRows: [],
			// Column For Sorting, "#" Is The Original Order
			sortColumn: this.sortBy,
			// Search Query
			query: '',
			// Table Headers
			headers: [],
			// Mapped Data
			items: [],
			// Mapped Action Buttons
			buttons: [],
			// Loading State For Ajax Requests
			ajaxLoading: false,
			// Items To Be Displayed
			renderedItems: [],
			// Selected Items
			selected: [],

		}
	},
	props: {
		// =================================
		// Ajax
		// Datatables Ajax Uses Axios
		// Make Sure Axios Is Added As An NPM Dependency
		// =================================
		// Ajax URL
		url: {
			type: String,
			default: () => ''
		},
		// Whether Or Not To Use Ajax
		ajax: {
			type: Boolean,
			default: () => false
		},
		// Key Holding The Items In The Ajax Response, A Plain Array Response Is Also Accepted
		ajaxKey: {
			type: String,
			default: 'data'
		},
		// Column To Sort By Initially, Use "#" For The Original Order
		sortBy: {
			type: String,
			default: '#'
		},
		// Direction Of The Initial Sort
		sortOrder: {
			type: String,
			default: 'asc',
			validator: value => ['asc', 'desc'].includes(value)
		},
		// Default Number Of Rows Per Page
		perPage: {
			type: Number,
			default: 100
		},
		// Ajax Headers
		AjaxHeaders: {
			type: Object,
			default: () => ({})
		},
		
		
		// Table Items
		data: {
			type: Array,
			default: () => []
		},
		// Action Buttons For Each Item
		actions: {
			type: Array,
			default: () => []
		},
		// Columns and Appropriate Data Assigment
		columns: {
			type: Array,
			default: () => []
		},
		filters: {
			type: Array,
			default: () => []
		},
		// Whether or Not Items Should Be Indexed
		index: {
			type: Boolean,
			default: () => true
		},
		// Set Loading Status 
		loading: {
			type: Boolean,
			default: () => false
		},
		// Click Events For Each Cell
		onClick: {
			type: Function,
			default: null
		},
		// Whether Or Not The Table Should Be Allowed To Break Elements
		breakWords: {
			type: Boolean,
			default: () => false
		},
		// Whether Or Not The Header Should Be Visible
		header: {
			type: Boolean,
			default: () => true
		},
		// Whether Or Not The Footer Should Be Visible
		footer: {
			type: Boolean,
			default: () => true
		},
		// Whether Or Not Searching Should Be Available
		searchable: {
			type: Boolean,
			default: () => true
		},
		// Whether Or Not Page Limitation Should Be Changeable
		limitable: {
			type: Boolean,
			default: () => true
		},
		// Whether Or Not Details Should Be Visible
		pageDetails: {
			type: Boolean,
			default: () => true
		},
		// Whether Or Not The Results Should Be Paginatable
		paginatable: {
			type: Boolean,
			default: () => true
		},

		// Whether Or Not Items Should Be Selctable
		selectable: {
			type: Boolean,
			default: () => false
		}
	},
	methods: {
		// Navigate To Provided Page
		// Arguments
		// 	Page: int
		paginate(page) {
			this.currentPage = Math.min(Math.max(page, 1), this.lastPage);
		},
		// Navigate To Next Page
		next() {
			this.paginate(this.currentPage + 1);
		},
		// Navigate To Previous Page
		prev() {
			this.paginate(this.currentPage - 1);
		},
		// Navigate To Last Page
		end() {
			this.paginate(this.lastPage);
		},
		// Navigate To First Page
		start() { 
			this.paginate(1);
		},
		// Search Through Items With Provided Search Query 
		// Arguments
		// 	Query: string
		search(query) {
			var needle = String(query || "").toLowerCase();
			var matches = value => value != null && value.toString().toLowerCase().includes(needle);

			this.renderedItems = this.allRows.filter(item => {
				// Search In Mapped Data
				if (item.details.some(detail => matches(detail.value) || matches(detail.rendered))) {
					return true;
				}
				// Search In Provided Data
				return Object.keys(item.row).some(column => matches(item.row[column]));
			});

			this.resort();
		},
		// Compare Two Raw Values For Sorting, Empty Values Go Last
		compare(x, y) {
			var xEmpty = x == null || x === "", yEmpty = y == null || y === "";
			if (xEmpty || yEmpty) {
				return xEmpty === yEmpty ? 0 : (xEmpty ? 1 : -1);
			}
			if (typeof x === "number" && typeof y === "number") {
				return x - y;
			}
			return String(x).localeCompare(String(y), undefined, {numeric: true, sensitivity: "base"});
		},
		// Sort The Displayed Items By A Column And Direction
		// Arguments
		// 	Column: String, "#" Is The Original Order
		// 	Asc: Boolean
		applySort(column, asc) {
			this.sortColumn = column;
			this.asc = asc;

			var direction = asc ? 1 : -1;
			var valueOf = item => {
				var detail = item.details.find(detail => detail.name == column);
				return detail ? detail.value : null;
			};

			this.renderedItems = this.renderedItems.slice().sort((a, b) => {
				if (column === '#') {
					return direction * (a.index - b.index);
				}
				var x = valueOf(a), y = valueOf(b);
				var empty = x == null || x === "" || y == null || y === "";
				// Empty Values Stay Last Regardless Of Direction
				return empty ? this.compare(x, y) : direction * this.compare(x, y);
			});

			this.currentPage = 1;
		},
		// Apply The Current Sort Again, For Example After The Rows Changed
		resort() {
			this.applySort(this.sortColumn, this.asc);
		},
		// Sort Items By Specified Column, Toggling The Order When Clicked Again
		// Arguments
		// 	Column: String
		sort(column) {
			this.applySort(column, column !== this.sortColumn ? true : !this.asc);
		},
		// Sort Items By Their Original Position
		// Arguments
		// 	Asc: Boolean, Toggles The Current Order If Omitted
		sortIndex(asc) {
			this.applySort('#', asc !== undefined ? asc : (this.sortColumn === '#' ? !this.asc : true));
		},

		filter(filter){
			var filterValue = filter.value,
			filterColumn = filter.name;

			this.renderedItems = this.allRows.filter((item, index) => {
				var column = item.details.find(column => column.name == filterColumn);
				if (!column) {
					return false;
				}
				// If Value Type Is A Custom Function
				if (typeof filterValue === "function") {
					return !!filterValue(item.row, column.value, index);
				}
				return column.value == filterValue || column.rendered == filterValue;
			});

			this.resort();
		},

		getHeaders() {
			this.headers = this.columns.map((item) => ({name: item.name, th: item.th, show: item.show !== false}));
		},
		mapItems(items) {
			items = items.map((item, index) => {
				// Row Item
				var row = {
					row: item,
					details: [],
					index,
					buttons: [],
					selected: !!this.selected.find(a => a.index == index)
				};

				// Get Provided Columns
				this.columns.forEach((column, index2) => {
					
					row.details.push({
						// Item Column Name
						name:column.name,
						// Table Header Title
						th: column.th,
						// Provided Value
						value: item[column.name],
						// Decide Value Depending On Whether Render Method Is Provided
						rendered: column.render ? column.render(item, item[column.name], index) : item[column.name],
						// Origin Item Row
						row: item,
						// Whether Or Not To Display Item
						show: column.show !== false,
						// Click Event For Column
						click: column.click,
						// Whether Or Not The Rendered Value Should Be Treated As HTML
						html: column.html === true
					});

				});

				// Get Provided Actions
				this.actions.forEach((button, index3) => {

					row.buttons.push({
						// Spread Provided Button Properties
						...button,
						// Decide Visibility Depending On Whether Show Method Is Provided
						// Default: true
						show: button.show ? button.show(item,index) : true,
						disabled: button.disabled ? button.disabled(item, index) : false
					});

				});

				return row;
			});			
			return items;
		} ,
		click(row, cell, name, index) {
			if (this.onClick) {
				this.onClick(...arguments);
			}
		},
		columnClick(action, row, cell, name, index) {
			if (action) {
				action(row, cell, name, index);
			}

		},
		selectAll(event) {
			// Only Rows On The Current Page Are Affected
			var checked = event.target.checked;
			this.paginatedItems.forEach(item => {
				if (item.selected !== checked) {
					this.select(item, false);
				}
			});
			this.$emit("selection-change", this.selected.map(item => item.row));
		},
		select(item, notify = true) {
			var index = this.selected.findIndex(a => a.index == item.index);
			if (index > -1) {
				item.selected = false;
				this.selected.splice(index, 1);
			}else {
				item.selected = true;
				this.selected.push(item);
			}
			if (notify) {
				this.$emit("selection-change", this.selected.map(item => item.row));
			}
		},

		
		// Alerts
		success(success = "Success") {
			toastr.success(success);
		},
		error(error = "Error") {
			toastr.error(error);
		}
	},
	computed: {
		// Total Number Of Pages For Pagination
		pages() {
			if (this.renderedItems.length > this.itemsPerPage) {
				return Math.ceil(this.renderedItems.length / this.itemsPerPage);
			}else {
				return 0;
			}
		},
		// Array Of Links With Page Number For Pagination
		paginateLinks() {
			var links = [];
			var approved = [];
			let center = Math.round(this.pages / 2) - 1 ;
			for (var i = 0; i < this.pages; i++) {
				if (this.pages > 6) {
					let difference = this.currentPage - i;
					let centerDifference = center - i;
					// around the current page
					if (!(difference < 0) && !(difference > 2)) {
					// around the center
					}else if (i === center) {
					// at the start or end
					}else if (this.pages - i <= 2 || i <= 1){
					// everywhere else
					}else {
						continue;
					}
				}
				links.push({page: i + 1});
			}
			return links;
		},
		// Page Size Options, Always Including The Configured Default
		pageSizes() {
			var sizes = [1, 2, 5, 10, 15, 20, 25, 50, 75, 100];
			if (!sizes.includes(this.perPage)) {
				sizes.push(this.perPage);
			}
			return sizes.sort((a, b) => a - b);
		},
		// Last Available Page Number
		lastPage() {
			return Math.max(1, Math.ceil(this.renderedItems.length / this.itemsPerPage));
		},
		// Whether Every Row On The Current Page Is Selected
		allSelected() {
			return this.paginatedItems.length > 0 && this.paginatedItems.every(item => item.selected);
		},
		showFilters() {
			return Object.keys(this.filters).length > 0;
		}
	},
	watch: {
		currentPage(newValue) {
			this.paginatedItems = this.renderedItems.slice(this.itemsPerPage * (newValue - 1), (this.itemsPerPage * newValue));
		},
		itemsPerPage(newValue) {
			this.currentPage = 1;
			this.paginatedItems = this.renderedItems.slice(newValue * (this.currentPage - 1), (newValue * this.currentPage));
		},
		items(newValue) {
			this.getHeaders();

			// Selection Belongs To The Previous Data, Clear It Before Mapping The New Rows
			var hadSelection = this.selected.length > 0;
			this.selected = [];
			if (hadSelection) {
				this.$emit("selection-change", []);
			}

			this.allRows = this.mapItems(newValue);
			this.renderedItems = this.allRows.slice();

			// Keep Any Active Search Applied To The New Data
			if (this.query) {
				this.search(this.query);
			} else {
				this.resort();
			}
		},
		sortBy(column) {
			this.applySort(column, this.sortOrder !== 'desc');
		},
		sortOrder(order) {
			this.applySort(this.sortColumn, order !== 'desc');
		},
		query(value) {
			this.search(value);
		},
		data(newValue) {
			this.items = newValue;
		},
		renderedItems(newValue) {
			this.paginatedItems = newValue.slice(this.itemsPerPage * (this.currentPage - 1), (this.itemsPerPage * this.currentPage));
		}
	},
	// Lifetime Events
	async mounted() {
		// Parse Headers 
		this.getHeaders();

		// Use Provided Data If Ajax Is Not Specified 
		if (!this.ajax) {
			// Map Items From Provided Data
			this.items = this.data;
			// Get All Items In Current Page
			// this.paginatedItems = this.renderedItems.slice(this.itemsPerPage * (this.currentPage - 1), (this.itemsPerPage * this.currentPage));
		}else {
			// Get Data From Server Using Ajax
			this.ajaxLoading = true;
			await Axios
				.get(this.url, {headers: this.AjaxHeaders})
				.then(response => {
					var items = Array.isArray(response.data) ? response.data : response.data[this.ajaxKey];
					if (!Array.isArray(items)) {
						return this.error("Unable To Parse Data");
					}
					this.items = items;
					this.success("Data Loaded");
				})
				.catch(error => {
					this.error((error && error.message) || "Unable To Load Data");
				});
			this.ajaxLoading = false;
		}
	}
}
</script>

<style lang="sass">
@keyframes spin
	from
		transform: rotate(0deg)
	to
		transform: rotate(359deg)
.data-table
	// font-size: 14px
	&-loading
		align-items: center
		display: flex
		height: 200px
		flex-flow: column
		justify-content: center
		position: relative
		width: 100%
		&-spinner
			animation: spin 1s linear infinite
			border-radius: 999px
			border: 2px solid #007bff
			border-top-color: transparent
			content: ''
			height: 75px
			margin-bottom: 15px
			width: 75px
		&-text
			font-weight: 300
			text-transform: uppercase
	
	&-control
		.custom-select
			width: initial
	
	.table
		&-responsive
			margin-bottom: 30px
			&::-webkit-scrollbar
				-webkit-appearance: none
				height: 15px
				width: 15px
				&-track
					background: #eee
					border-radius: 999px
				&-thumb
					background: #ccc
					border-radius: 999px
					border: 3px solid #eee
					&:focus
						background: #ccc
		&.straight
			white-space: nowrap
		thead
			th
				font-size: 12px
				font-weight: 500
				&.sortable
					cursor: pointer
					padding-right: 30px
					position: relative
					&:before,
					&:after
						border: 5px solid transparent
						content: ''
						display: block
						opacity: .3
						position: absolute
						right: 10px
					&:before
						border-bottom-color: currentColor
						top: 10px
					&:after
						bottom: 10px
						border-top-color: currentColor
				&.sort
					font-weight: 700
					&.asc
						&:before
							opacity: 1
					&.desc
						&:after
							opacity: 1
		tbody
			tr
				&.clickable
					cursor: pointer
			td
				// font-size: 12px

		&-filters
			margin-bottom: 15px
		&-filter
			background: #fff
			border-radius: 3px
			cursor: pointer
			color: #777
			display: inline-block
			font-size: 12px
			padding: 5px 15px
			margin: 0 0 3px 3px
			&:hover
				background: #aaa
				color: #fff
			&.active
				background: #337ab7
				color: #fff


</style>
