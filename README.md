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
|   Option   	 |   Data Type   |   Default  	|
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
				data: [],

				// Columns that should be displayed
				columns: [
					{name: "first_name", th: "First Name"},
					{name: "last_name", th: "Last Name"},
					{name: "email", th: "Email Address"},
					{name: "phone", th: "Phone Number"},
					{name: "date_of_birth", th: "Date Of Birth", render (row, cell, index) {
						return moment(cell).fromNow();
					}},
				]
			}
		}
	}
</script>
```