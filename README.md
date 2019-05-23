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
|	Option   	 |   Data Type   |   Default  	|
|----------------|---------------|--------------|
| 	data	 	 |   Array       |   []			|
| 	actions	 	 |   Array       |   []			|
| 	columns	 	 |   Array       |   []			|
| 	index	 	 |   Boolean     |   true		|
| 	loading	 	 |   Boolean     |   false		|
| 	onClick	 	 |   Function    |   {} 		|
| 	breakWords	 |   Boolean     |   false		|
| 	header	 	 |   Boolean     |   true		|
| 	footer	 	 |   Boolean     |   true		|
| 	searchable	 |   Boolean     |   true		|
| 	limitable	 |   Boolean     |   true		|
| 	pageDetails	 |   Boolean     |   true		|
| 	paginatable	 |   Boolean     |   true		|


## Example
Here's how you would use it in Example.vue

```vue
<!-- Include Datatable Component -->
<datatable :data="[]" :columns="[]" :actions="[]"></datatable>

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

				// Columns that should be displayed
				columns: [
					{name: "first_name", th: "First Name"},
					{name: "last_name", th: "Last Name"},
					{name: "email", th: "Email Address"},
					{name: "phone", th: "Phone Number"},
					{name: "date_of_birth", th: "Date Of Birth", show: false},
					{name: "age", th: "Age", render (row, cell, index) {
						// Parse date and display difference
						return moment(cell).fromNow();

						return moment(row.date_of_birth).fromNow()
					}},
				]
			}
		}
	}
</script>
```