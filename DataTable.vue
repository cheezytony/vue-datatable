<!-- 
	Vue Datatable 
	Description: Vue Component for datatable with search, sorting, editing and pagination
	Author: Antonio Okoro 
	Version: 1.0.0 
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
							<select  class="custom-select custom-select-sm" v-model="itemsPerPage">
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="5">5</option>
								<option value="10">10</option>
								<option value="15">15</option>
								<option value="20">20</option>
								<option value="25">25</option>
								<option value="50">50</option>
								<option value="75">75</option>
								<option value="100">100</option>
							</select> 
							rows
						</label>
					</div>
				</div>
				<div class="col-md-6" v-if="searchable">
					<div class="form-group">
						<input type="text" class="form-control form-control-sm" placeholder="Search Records" @keyup="search(query)" v-model="query">
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
									<input type="checkbox" class="custom-control-input" @change="selectAll">
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
								v-bind:key="index" 
								v-for="(th, index) in headers" 
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
						<tr v-bind:key="i" v-for="(item, i) in paginatedItems" :class="{clickable: !!onClick}">

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
								<span v-html="td.rendered != null ? td.rendered : '----'"></span>
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
							<td align="center" :colspan="headers.length + (actions.length ? 1 : 0) + (index ? 1 : 0)">No results</td>
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
				<div class="col-md-6" v-if="paginate">
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
import moment from "moment";
import Vue from 'vue';
export default {
	data() {
		return {
			// Items TO Display For Each Paginated Page
			itemsPerPage: 100,
			// Current Page Number In Pagination
			currentPage: 1,
			// Current Page Items
			paginatedItems: [],
			// Sort Order
			asc: "asc",
			// Column For Sorting
			sortColumn: null,
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
		// Ajax Headers
		AjaxHeaders: {
			type: Object,
			default: () => {}
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
			default: () => {}
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
			this.currentPage = page;
		},
		// Navigate To Next Page
		next() {
			this.currentPage = this.currentPage >= this.renderedItems.length ? 0 : this.currentPage + 1;
		},
		// Navigate To Previous Page
		prev() {
			this.currentPage = this.currentPage <= 0 ? this.renderedItems.length : this.currentPage - 1;
		},
		// Navigate To Last Page
		end() {
			this.currentPage = this.renderedItems.length;
		},
		// Navigate To First Page
		start() { 
			this.currentPage = 1;
		},
		// Search Through Items With Provided Search Query 
		// Arguments
		// 	Query: string
		search(query) {
			var items = this.mapItems(this.items);
			let retval = items.filter(item => {
				
				var found = false;
				// Search In Mapped Data
				item.details.forEach(detail => {
					// Cancel If Original And Processed Value Are NULL
					if (detail.value == null || detail.rendered == null) {
						return;
					}
					// If Found In Original Value
					if (detail.value.toString().match(new RegExp(query, "i"))) {
						found = true;
					}

					// If Found In Processed Value
					if (detail.rendered.toString().match(new RegExp(query, "i"))) {
						found = true;
					}
				});

				// Search In Provided Data
				for (var column in item.row) {
					if (!item.row[column]) {
						continue;
					}

					if (item.row[column].toString().match(new RegExp(query, "i"))) {
						found = true;
					}
				}

				return found;
			});
			this.renderedItems = retval;

			this.sortIndex(false);
		},
		// Sort Items By Specified Column and Order
		// Arguments
		// 	Column: String
		// 	Order: String [asc, desc]
		sort(column) {
			
			this.renderedItems = this.renderedItems.sort((a,b) => {
				var detailx = a.details.find(detail => detail.name == column);
				var x = detailx.rendered;
				if (!x) {
					
				}
				x = typeof x == 'string' ? x.toLowerCase() : x;
				var detaily = b.details.find(detail => detail.name == column);
				var y = detaily.rendered;
				if (!x) {
					
				}
				y = typeof y == 'string' ? y.toLowerCase() : y;
				return x > y ? 1 : -1;
			});
			if (column !== this.sortColumn) {
				this.asc = true;
			}else {
				this.asc = !this.asc;
			}

			if (!this.asc) {
				this.renderedItems = this.renderedItems.reverse();
			}
			this.sortColumn = column;

			this.currentPage = 1;
		},

		sortIndex(asc){
			this.renderedItems = this.renderedItems.sort((a, b) => {
				var indexA = a.index;
				var indexB = b.index;
				return indexA > indexB ? 1 : -1;
			});
			this.asc = this.sortColumn == '#' ? !this.asc : true;

			if (asc != undefined) {
				if (!asc) {
					// console.log(this.renderedItems);
					this.renderedItems = this.renderedItems.reverse();
				}
			}else {
				if (!this.asc) {
					this.renderedItems = this.renderedItems.reverse();
				}
			}
			
			this.sortColumn = '#';

			this.currentPage = 1;
		},

		filter(filter){
			var filterValue = filter.value,
			filterColumn = filter.name;

			var items = this.mapItems(this.items);
			var filtered = items.filter((item, index) => {
				var column = item.details.find((column, i) => column.name == filterColumn);
				if (!column) {
					return false;
				}
				// If Value Type Is A Custom Function
				if (filterValue.constructor.toString().match(/Function/)) {
					if (filterValue(item.row, column.value, index)) {
						return true;
					}
				}else if (column.value == filterValue || column.rendered == filterValue) {
					return true;
				}
				return false;
			});

			this.renderedItems = filtered;
			this.currentPage = 1;

			this.sortIndex(false);
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
						click: column.click
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
			if (event.target.checked) {
				this.selected = [];
				this.renderedItems.forEach(item => {
					item.selected = true;
					this.selected.push(item);
				});
			}else {
				this.selected = [];
				this.renderedItems.forEach(item => {
					item.selected = false;
				});
			}
		},
		select(item) {
			var index = this.selected.findIndex(a => a.index == item.index);
			if (index > -1) {
				item.selected = false;
				this.selected.splice(index, 1);
			}else {
				item.selected = true;
				this.selected.push(item);
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

			this.renderedItems = this.mapItems(newValue);

			// Get All Items In Current Page
			this.paginatedItems = this.renderedItems.slice(this.itemsPerPage * (this.currentPage - 1), (this.itemsPerPage * this.currentPage));

			this.asc = true;

			this.sortIndex();
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

		// Set Default Sorting To Index
		// Asc will be converted to false so order will be in reverse
		this.asc = true;
		this.sortIndex();

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
				.get(this.url)
				.then(response => {
					if (!response.data.data) {
						return this.error("Unable To Parse Data");
					}
					this.items = response.data.data;
					this.success("Data Loaded");
				})
				.catch(error => {
					this.error(error || "Unable To Load Data");
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
			text-trnasform: uppercase
	
	&-control
		.custom-select
			width: initial
	
	.table
		&-responsive
			margin-bottom: 30px
			&::-webkit-scrollbar
				-webkit-apperance: none
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
