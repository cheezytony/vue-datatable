import Vue from "vue";
import { createLocalVue, mount } from "@vue/test-utils";
import DataTable, { install, DataTable as Named } from "../index";
import Component from "../DataTable.vue";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("toastr", () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

describe("index", () => {
	it("exports the component as default and by name", () => {
		expect(DataTable).toBe(Component);
		expect(Named).toBe(Component);
	});

	it("registers the datatable component globally on import", () => {
		expect(Vue.options.components.datatable).toBeDefined();
	});

	it("registers the component on whichever Vue constructor it is installed on", () => {
		const target = { component: jest.fn() };
		install(target);
		expect(target.component).toHaveBeenCalledWith("datatable", Component);
	});

	it("can be installed with Vue.use", () => {
		const localVue = createLocalVue();
		localVue.component = jest.fn();
		localVue.use({ install });
		expect(localVue.component).toHaveBeenCalledWith("datatable", Component);
	});

	it("works when used by its registered name", () => {
		const wrapper = mount({ template: "<datatable :columns=\"[]\" :data=\"[]\" />" });
		expect(wrapper.find(".data-table").exists()).toBe(true);
	});
});
