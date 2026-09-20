import Vue from "vue";
import DataTable from "./DataTable.vue";

// Allows `Vue.use(DataTable)` To Register The Component
export function install(VueInstance = Vue) {
	VueInstance.component("datatable", DataTable);
}

// Register Datatable As Global Component
install(Vue);

export { DataTable };
export default DataTable;
