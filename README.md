# vue-datatable

```javascript
// Import Package
require("bootstrap-vue-datatable");
```


```vue
<!-- Include Component -->
<datatable :data="[]" :columns="[]" :actions="[]"></datatable>
```

```vue
<!-- Using Ajax -->
<datatable :ajax="true" :url="https://demosite.com/api/users" :columns="[]" :actions="[]"></datatable>
```


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
          { first_name: "Antonio",
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


## Configuration
| Option     |  Description                         |   Data Type   |   Default   |
|----------------|--------------------------------------------------------------|---------------|---------------|
|   ajax     |  Use ajax to fetch data from server              |   Array       |   false      |
|   url     |  Server url to load data from while using ajax              |   Array       |   ""      |
|   data     |  Items to be displayed in the table              |   Array       |   []      |
|   actions    |  Action Buttons For Each Item                |   Array       |   []      |
|   columns    |  Columns and Appropriate Data Assigment            |   Array       |   []      |
|   index    |  Whether or Not Items Should Be Indexed            |   Boolean     |   true    |
|   loading    |  Set Loading Status                      |   Boolean     |   false   |
|   onClick    |  A function to be called whenever a cell is clicked      |   Function    |   {}      |
|   breakWords   |  Whether Or Not The Table Should Be Allowed To Break Text  |   Boolean     |   false   |
|   header     |  Whether Or Not The Header Should Be Visible         |   Boolean     |   true    |
|   footer     |  Whether Or Not The Footer Should Be Visible         |   Boolean     |   true    |
|   searchable   |  Whether Or Not Searching Should Be Available        |   Boolean     |   true    |
|   limitable  |  Whether Or Not Page Limitation Should Be Changeable     |   Boolean     |   true    |
|   pageDetails  |  Whether Or Not Details Should Be Visible          |   Boolean     |   true    |
|   paginatable  |  Whether Or Not The Results Should Be paginatable      |   Boolean     |   true    |




#### ajax
Whether or not to use ajax for loading data into the table

#### url
This sets the ajax url to fetch data from if ajax is enabled

#### data
Items to be displayed in the table
<br/>
Should be an array of objects
```javascript
[
  { first_name: "Antonio",
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
  }
]
```

#### actions
Action Buttons For Each Item Row
<br/>
Should be an array of objects
<br/>
Each button uses bootstrap button styles and classess

#### Action Properties
```text```
Text to be displayed on the button

```color```
Color of the button ```primary```, ```success```, ```danger```, ```warning```, ```info```, ```dark```, ```light```, ```any others defined in the css```

```size```
Size of the button ```sm```, ```lg```, ```any others defined in the css```

```action```
Function to be called whenever the button is clicked
<br/>
it passess three arguments to the provided function

| parameter | description   |
|---------------|-------------------|
| row     | table row   |
| name    |   the name value provided in the columns config |
| index   |   numeric index of the row starting from 0  |

```javascript
{
  render(row, cell, index){
    return `<a href="${cell}">${cell}</a>`;
  }
}
```

#### columns
Columns and Appropriate Data Assigment

##### Column Properties
```name```
Name of the column for identification

```th```
Title of the column to be displayed on the table header

```render```
Custom function to display the columns data
<br/>
it passess three arguments to the provided function

| parameter | description   |
|---------------|-------------------|
| row     | table row   |
| cell    | data for the table cell   |
| index   |   numeric index of the row starting from 0  |

```javascript
{
  render(row, cell, index){
    return `<a href="${cell}">${cell}</a>`;
  }
}
```


#### index
Whether or Not Items Should Be Indexed
<br/>
default: ```true```

#### loading
Set Loading Status
<br/>
whenever this property changes the state will as well
<br/>
default: ```false```

#### onClick
A function to be called whenever a cell is clicked
<br/>
It passes four arguments to the provided function

| parameter | description   |
|---------------|-------------------|
| row     | table row   |
| cell    | data for the table cell   |
| name    |   the name value provided in the columns config |
| index   |   numeric index of the row starting from 0  |

```<datatable :data="data" :columns="columns" :onclick="click"></datatable>```
```javascript
methods: {
  click(row, cell, name, index) {

  }
}
```


#### breakWords
Whether Or Not The Table Should Be Allowed To Break Text
<br/>
default: ```false```

#### header
Whether Or Not The Header Section Should Be Visible
<br/>
i.e the page limit and search sections at the top
<br/>
default: ```true```

#### footer
Whether Or Not The Footer Section Should Be Visible
<br/>
i.e the current page details and the pagination links at the bottom
<br/>
default: ```true```

#### searchable
default: ```true```
Whether Or Not Searching Should Be Available
<br/>

#### limitable
Whether Or Not Page Limitation Should Be Changeable
<br/>
default: ```true```

#### pageDetails
Whether Or Not Details Should Be Visible
<br/>
default: ```true```

#### paginatable
Whether Or Not The Results Should Be paginatable
<br/>
default: ```true```
