# vue-datatable

```javascript
// Import Package
require("bootstrap-vue-datatable");
```


```vue
<!-- Include Component -->
<datatable :data="[]" :columns="[]" :actions="[]"></datatable>
```


## Configuration
|	Option   	 |	Description													|   Data Type   |   Default  	|
|----------------|--------------------------------------------------------------|---------------|---------------|
| 	data	 	 | 	Table Items													|   Array       |   []			|
| 	actions	 	 | 	Action Buttons For Each Item								|   Array       |   []			|
| 	columns	 	 | 	Columns and Appropriate Data Assigment 						|   Array       |   []			|
| 	index	 	 | 	Whether or Not Items Should Be Indexed						|   Boolean     |   true		|
| 	loading	 	 | 	Set Loading Status 											|   Boolean     |   false		|
| 	onClick	 	 | 	Click Events For Each Cell									|   Function    |   {} 			|
| 	breakWords	 | 	Whether Or Not The Table Should Be Allowed To Break Text	|   Boolean     |   false		|
| 	header	 	 | 	Whether Or Not The Header Should Be Visible					|   Boolean     |   true		|
| 	footer	 	 | 	Whether Or Not The Footer Should Be Visible					|   Boolean     |   true		|
| 	searchable	 | 	Whether Or Not Searching Should Be Available				|   Boolean     |   true		|
| 	limitable	 | 	Whether Or Not Page Limitation Should Be Changeable			|   Boolean     |   true		|
| 	pageDetails	 | 	Whether Or Not Details Should Be Visible					|   Boolean     |   true		|
| 	paginatable	 | 	Whether Or Not The Results Should Be paginatable			|   Boolean     |   true		|


## Example
Here's how you would use it in Example.vue


```vue
<!-- Include Datatable Component -->
<datatable :data="data" :columns="columns" :actions="[]"></datatable>

<script>
	// Use only if you want to parse dates
	import "moment" from "moment";


	export default {
		data() {
			return {
				// Data to be passed to component
				data: [
					{	first_name: "Antonio",
						last_name: "Okoro",
						email: "cheezytony1@gmail.com",
						date_of_birth: "1998-05-15"
					},
					{
						first_name: "Naruto",
						last_name: "Uzumaki",
						email: "narutouzumaki@gmail.com",
						date_of_birth: "1987-10-10"
					},
					{
						first_name: "Sasuke",
						last_name: "Uchiha",
						email: "sasukeuchiha@gmail.com",
						date_of_birth: "1987-07-23"
					},
					{
						first_name: "Rock",
						last_name: "Lee",
						email: "rocklee@gmail.com",
						date_of_birth: "1985-11-27"
					},
					{
						first_name: "Neji",
						last_name: "Hyuga",
						email: "nejihyuga@gmail.com",
						date_of_birth: "1985-09-22"
					},
					{
						first_name: "Shikamaru",
						last_name: "Nara",
						email: "shikamarunara@gmail.com",
						date_of_birth: "1987-09-22"
					}
				],

				// Columns that should be displayed on The Table
				columns: [
					{name: "first_name", th: "First Name"},
					{name: "last_name", th: "Last Name"},
					{name: "email", th: "Email Address"},
					{name: "phone", th: "Phone Number"},
					{name: "date_of_birth", th: "Date Of Birth", show: false},
					{name: "age", th: "Age", render (row, cell, index) {
						// Parse date and display difference
						return moment(row.date_of_birth).fromNow();
					}},
				],
				actions: [
					{text: "Delete", color: "danger", action: (row, index) => {
						alert(`about to delete ${row.first_name} ${row.last_name}`);
					}}
				]
			}
		}
	}
</script>
```