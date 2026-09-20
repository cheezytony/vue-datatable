import { mount } from "@vue/test-utils";
import Axios from "axios";
import toastr from "toastr";
import DataTable from "../DataTable.vue";

jest.mock("axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("toastr", () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

// Let Watchers And Pending Promises Settle
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const columns = [
	{ name: "name", th: "Name" },
	{ name: "age", th: "Age" }
];

const people = [
	{ name: "Charlie", age: 30 },
	{ name: "alice", age: 5 },
	{ name: "Bob", age: 100 },
	{ name: "item10", age: null },
	{ name: "item2", age: 20 }
];

const build = async (propsData = {}) => {
	const wrapper = mount(DataTable, {
		propsData: { data: people, columns, index: false, ...propsData }
	});
	await flush();
	return wrapper;
};

// Text Of Every Cell In The Nth Column Of The Body
const column = (wrapper, n) => wrapper.findAll("tbody tr").wrappers.map(tr => tr.findAll("td").at(n).text());

const numbered = count => Array.from({ length: count }, (_, i) => ({ name: `Person ${i + 1}`, age: i }));

beforeEach(() => {
	jest.clearAllMocks();
});

describe("rendering", () => {
	it("renders a header for each column and a row for each item", async () => {
		const wrapper = await build();
		expect(wrapper.findAll("thead th").wrappers.map(th => th.text())).toEqual(["Name", "Age"]);
		expect(wrapper.findAll("tbody tr")).toHaveLength(5);
		expect(column(wrapper, 0)).toEqual(["Charlie", "alice", "Bob", "item10", "item2"]);
	});

	it("shows an index column starting at 1 when index is enabled", async () => {
		const wrapper = await build({ index: true });
		expect(wrapper.findAll("thead th").at(0).text()).toBe("#");
		expect(column(wrapper, 0)).toEqual(["1", "2", "3", "4", "5"]);
	});

	it("shows a placeholder for null values", async () => {
		const wrapper = await build();
		expect(column(wrapper, 1)).toContain("----");
	});

	it("uses a column's render function", async () => {
		const wrapper = await build({
			columns: [{ name: "name", th: "Name", render: (row, value) => value.toUpperCase() }]
		});
		expect(column(wrapper, 0)[0]).toBe("CHARLIE");
	});

	it("hides columns with show set to false", async () => {
		const wrapper = await build({
			columns: [{ name: "name", th: "Name" }, { name: "age", th: "Age", show: false }]
		});
		expect(wrapper.findAll("thead th").wrappers.map(th => th.text())).toEqual(["Name"]);
		expect(wrapper.findAll("tbody tr").at(0).findAll("td")).toHaveLength(1);
	});

	it("shows the empty message spanning every visible column", async () => {
		const wrapper = await build({
			data: [],
			index: true,
			selectable: true,
			actions: [{ text: "Edit", action: jest.fn() }],
			columns: [{ name: "name", th: "Name" }, { name: "age", th: "Age", show: false }]
		});
		const cell = wrapper.find("tbody td");
		expect(cell.text()).toBe("No results");
		// One Visible Column + Index + Checkbox + Actions
		expect(cell.attributes("colspan")).toBe("4");
	});

	it("shows the loading state while the loading prop is set", async () => {
		const wrapper = await build({ loading: true });
		expect(wrapper.find(".data-table-loading").exists()).toBe(true);
		expect(wrapper.find("table").exists()).toBe(false);
	});

	it("hides the header and footer when requested", async () => {
		const wrapper = await build({ header: false, footer: false });
		expect(wrapper.find(".data-table-control").exists()).toBe(false);
		expect(wrapper.find(".showing").exists()).toBe(false);
	});

	it("shows the range of visible items", async () => {
		const wrapper = await build();
		expect(wrapper.find(".showing").text().replace(/\s+/g, " ")).toBe("Showing 1 to 5 of 5 items");
	});

	it("updates when the data prop changes", async () => {
		const wrapper = await build();
		await wrapper.setProps({ data: [{ name: "Zed", age: 1 }] });
		await flush();
		expect(column(wrapper, 0)).toEqual(["Zed"]);
	});
});

describe("html escaping", () => {
	const data = [{ name: "<b>bold</b>", age: 1 }];

	it("escapes values by default", async () => {
		const wrapper = await build({ data });
		const cell = wrapper.find("tbody td");
		expect(cell.find("b").exists()).toBe(false);
		expect(cell.text()).toBe("<b>bold</b>");
	});

	it("escapes the output of render functions by default", async () => {
		const wrapper = await build({
			data,
			columns: [{ name: "name", th: "Name", render: () => "<i>x</i>" }]
		});
		expect(wrapper.find("tbody td i").exists()).toBe(false);
	});

	it("renders HTML for columns that opt in with html: true", async () => {
		const wrapper = await build({
			data,
			columns: [{ name: "name", th: "Name", html: true }]
		});
		expect(wrapper.find("tbody td b").text()).toBe("bold");
	});
});

describe("page size", () => {
	it("defaults to 100 rows per page", async () => {
		const wrapper = await build({ data: numbered(120) });
		expect(wrapper.findAll("tbody tr")).toHaveLength(100);
		expect(wrapper.vm.itemsPerPage).toBe(100);
	});

	it("honours the perPage prop", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		expect(wrapper.findAll("tbody tr")).toHaveLength(10);
		expect(wrapper.find("select").element.value).toBe("10");
	});

	it("adds a custom perPage to the dropdown options", async () => {
		const wrapper = await build({ data: numbered(30), perPage: 12 });
		const options = wrapper.findAll("select option").wrappers.map(option => option.text());
		expect(options).toContain("12");
		expect(options.map(Number)).toEqual([...options.map(Number)].sort((a, b) => a - b));
		expect(wrapper.find("select").element.value).toBe("12");
	});

	it("does not duplicate a perPage that is already an option", async () => {
		const wrapper = await build({ perPage: 10 });
		const options = wrapper.findAll("select option").wrappers.map(option => option.text());
		expect(options.filter(option => option === "10")).toHaveLength(1);
	});

	it("changes the rows shown and returns to page 1 when the dropdown changes", async () => {
		const wrapper = await build({ data: numbered(30), perPage: 10 });
		wrapper.vm.paginate(3);
		await flush();
		const select = wrapper.find("select");
		select.element.value = "5";
		await select.trigger("change");
		await flush();
		expect(wrapper.vm.itemsPerPage).toBe(5);
		expect(wrapper.vm.currentPage).toBe(1);
		expect(wrapper.findAll("tbody tr")).toHaveLength(5);
	});

	it("hides the dropdown when limitable is false", async () => {
		const wrapper = await build({ limitable: false });
		expect(wrapper.find("select").exists()).toBe(false);
	});
});

describe("pagination", () => {
	const pageLinks = wrapper => wrapper.findAll(".pagination .page-link").wrappers.map(link => link.text());

	it("shows only the rows for the current page", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		expect(column(wrapper, 0)[0]).toBe("Person 1");
		wrapper.vm.paginate(3);
		await flush();
		expect(column(wrapper, 0)).toEqual(["Person 21", "Person 22", "Person 23", "Person 24", "Person 25"]);
		expect(wrapper.find(".showing").text().replace(/\s+/g, " ")).toBe("Showing 21 to 25 of 25 items");
	});

	it("moves between pages with next and prev", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		wrapper.vm.next();
		expect(wrapper.vm.currentPage).toBe(2);
		wrapper.vm.prev();
		expect(wrapper.vm.currentPage).toBe(1);
	});

	it("does not move past the first or last page", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		wrapper.vm.prev();
		expect(wrapper.vm.currentPage).toBe(1);
		wrapper.vm.end();
		expect(wrapper.vm.currentPage).toBe(3);
		wrapper.vm.next();
		expect(wrapper.vm.currentPage).toBe(3);
		wrapper.vm.paginate(99);
		expect(wrapper.vm.currentPage).toBe(3);
		wrapper.vm.paginate(-4);
		expect(wrapper.vm.currentPage).toBe(1);
		wrapper.vm.start();
		expect(wrapper.vm.currentPage).toBe(1);
	});

	it("stays on page 1 when everything fits on one page", async () => {
		const wrapper = await build();
		wrapper.vm.next();
		wrapper.vm.end();
		expect(wrapper.vm.currentPage).toBe(1);
		expect(wrapper.vm.lastPage).toBe(1);
	});

	it("navigates when page links are clicked", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		expect(pageLinks(wrapper)).toEqual(["1", "2", "3", "Next"]);
		await wrapper.findAll(".pagination .page-link").at(2).trigger("click");
		expect(wrapper.vm.currentPage).toBe(3);
		expect(pageLinks(wrapper)).toEqual(["Prev", "1", "2", "3"]);
		await wrapper.findAll(".pagination .page-link").at(0).trigger("click");
		expect(wrapper.vm.currentPage).toBe(2);
	});

	it("marks the current page as active", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		wrapper.vm.paginate(2);
		await flush();
		expect(wrapper.find(".page-item.active").text()).toBe("2");
	});

	it("hides the pagination links when paginatable is false", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10, paginatable: false });
		expect(wrapper.find(".pagination").exists()).toBe(false);
	});

	it("shows the pagination links by default", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		expect(wrapper.find(".pagination").exists()).toBe(true);
	});
});

describe("search", () => {
	const search = async (wrapper, query) => {
		await wrapper.find("input[type=text]").setValue(query);
		await flush();
	};

	it("filters rows as the query changes", async () => {
		const wrapper = await build();
		await search(wrapper, "item");
		expect(column(wrapper, 0)).toEqual(["item10", "item2"]);
	});

	it("is case insensitive", async () => {
		const wrapper = await build();
		await search(wrapper, "ALICE");
		expect(column(wrapper, 0)).toEqual(["alice"]);
	});

	it("matches values of columns that are not displayed", async () => {
		const wrapper = await build({
			data: [{ name: "Charlie", age: 30, email: "c@example.com" }, { name: "Bob", age: 4, email: "b@test.org" }]
		});
		await search(wrapper, "test.org");
		expect(column(wrapper, 0)).toEqual(["Bob"]);
	});

	it("matches numeric values", async () => {
		const wrapper = await build();
		await search(wrapper, "100");
		expect(column(wrapper, 0)).toEqual(["Bob"]);
	});

	it("matches the rendered value of a column", async () => {
		const wrapper = await build({
			columns: [{ name: "name", th: "Name", render: (row, value) => `Mr ${value}` }]
		});
		await search(wrapper, "mr bob");
		expect(column(wrapper, 0)).toEqual(["Mr Bob"]);
	});

	it.each(["(", "[", "*", "\\", "a.c", "+?"])("treats %s as plain text instead of a regular expression", async query => {
		const wrapper = await build({ data: [{ name: "a.c", age: 1 }, { name: "abc", age: 2 }] });
		await expect(search(wrapper, query)).resolves.toBeUndefined();
		expect(wrapper.find("table").exists()).toBe(true);
		if (query === "a.c") {
			expect(column(wrapper, 0)).toEqual(["a.c"]);
		}
	});

	it("shows the empty message when nothing matches", async () => {
		const wrapper = await build();
		await search(wrapper, "zzz");
		expect(wrapper.find("tbody td").text()).toBe("No results");
	});

	it("restores every row when the query is cleared", async () => {
		const wrapper = await build();
		await search(wrapper, "item");
		await search(wrapper, "");
		expect(wrapper.findAll("tbody tr")).toHaveLength(5);
	});

	it("returns to page 1 and updates the total", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		wrapper.vm.paginate(3);
		await flush();
		await search(wrapper, "Person 1");
		expect(wrapper.vm.currentPage).toBe(1);
		// Person 1, 10-19
		expect(wrapper.find(".showing").text().replace(/\s+/g, " ")).toBe("Showing 1 to 10 of 11 items");
	});

	it("lists results in their original order", async () => {
		const wrapper = await build();
		await wrapper.findAll("thead th").at(0).trigger("click");
		await search(wrapper, "i");
		// Charlie, alice, item10, item2 in original order
		expect(column(wrapper, 0)).toEqual(["Charlie", "alice", "item10", "item2"]);
		expect(wrapper.vm.sortColumn).toBe("#");
		expect(wrapper.vm.asc).toBe(true);
	});

	it("keeps an active query applied when the data changes", async () => {
		const wrapper = await build();
		await search(wrapper, "item");
		await wrapper.setProps({ data: [{ name: "item99", age: 1 }, { name: "other", age: 2 }] });
		await flush();
		expect(column(wrapper, 0)).toEqual(["item99"]);
	});

	it("hides the search box when searchable is false", async () => {
		const wrapper = await build({ searchable: false });
		expect(wrapper.find("input[type=text]").exists()).toBe(false);
	});
});

describe("sorting", () => {
	const clickHeader = async (wrapper, n) => {
		await wrapper.findAll("thead th").at(n).trigger("click");
	};

	it("sorts ascending on the first click and descending on the second", async () => {
		const wrapper = await build();
		await clickHeader(wrapper, 0);
		expect(column(wrapper, 0)).toEqual(["alice", "Bob", "Charlie", "item2", "item10"]);
		await clickHeader(wrapper, 0);
		expect(column(wrapper, 0)).toEqual(["item10", "item2", "Charlie", "Bob", "alice"]);
	});

	it("sorts numbers numerically rather than as text", async () => {
		const wrapper = await build();
		await clickHeader(wrapper, 1);
		expect(column(wrapper, 1)).toEqual(["5", "20", "30", "100", "----"]);
	});

	it("keeps empty values last in both directions", async () => {
		const wrapper = await build();
		await clickHeader(wrapper, 1);
		expect(column(wrapper, 1).pop()).toBe("----");
		await clickHeader(wrapper, 1);
		expect(column(wrapper, 1)).toEqual(["100", "30", "20", "5", "----"]);
	});

	it("sorts on the raw value rather than the rendered output", async () => {
		const wrapper = await build({
			columns: [{ name: "age", th: "Age", render: (row, value) => `${value} years` }],
			data: [{ age: 100 }, { age: 5 }, { age: 30 }]
		});
		await clickHeader(wrapper, 0);
		expect(column(wrapper, 0)).toEqual(["5 years", "30 years", "100 years"]);
	});

	it("starts ascending again when a different column is chosen", async () => {
		const wrapper = await build();
		await clickHeader(wrapper, 0);
		await clickHeader(wrapper, 0);
		await clickHeader(wrapper, 1);
		expect(wrapper.vm.asc).toBe(true);
		expect(wrapper.vm.sortColumn).toBe("age");
	});

	it("indicates the sort column and direction on the header", async () => {
		const wrapper = await build();
		const header = () => wrapper.findAll("thead th").at(0);
		expect(header().classes()).not.toContain("sort");
		await clickHeader(wrapper, 0);
		expect(header().classes()).toEqual(expect.arrayContaining(["sort", "asc"]));
		await clickHeader(wrapper, 0);
		expect(header().classes()).toEqual(expect.arrayContaining(["sort", "desc"]));
		expect(header().classes()).not.toContain("asc");
	});

	it("does not reorder the source data", async () => {
		const data = people.map(person => ({ ...person }));
		const wrapper = await build({ data });
		await clickHeader(wrapper, 0);
		expect(data.map(person => person.name)).toEqual(people.map(person => person.name));
	});

	it("keeps rows with equal values in their original order", async () => {
		const wrapper = await build({
			data: [{ name: "a", age: 1 }, { name: "b", age: 1 }, { name: "c", age: 1 }, { name: "d", age: 1 }]
		});
		await clickHeader(wrapper, 1);
		expect(column(wrapper, 0)).toEqual(["a", "b", "c", "d"]);
	});

	it("returns to page 1", async () => {
		const wrapper = await build({ data: numbered(25), perPage: 10 });
		wrapper.vm.paginate(3);
		await clickHeader(wrapper, 1);
		expect(wrapper.vm.currentPage).toBe(1);
	});

	describe("by index", () => {
		it("is the default order", async () => {
			const wrapper = await build({ index: true });
			expect(wrapper.vm.sortColumn).toBe("#");
			expect(wrapper.vm.asc).toBe(true);
			expect(column(wrapper, 1)).toEqual(["Charlie", "alice", "Bob", "item10", "item2"]);
		});

		it("toggles direction when the index header is clicked", async () => {
			const wrapper = await build({ index: true });
			await clickHeader(wrapper, 0);
			expect(column(wrapper, 0)).toEqual(["5", "4", "3", "2", "1"]);
			expect(wrapper.findAll("thead th").at(0).classes()).toContain("desc");
			await clickHeader(wrapper, 0);
			expect(column(wrapper, 0)).toEqual(["1", "2", "3", "4", "5"]);
		});

		it("restores the original order after sorting by a column", async () => {
			const wrapper = await build({ index: true });
			await clickHeader(wrapper, 1);
			await clickHeader(wrapper, 0);
			expect(column(wrapper, 0)).toEqual(["1", "2", "3", "4", "5"]);
		});
	});
});

describe("filters", () => {
	const filters = [
		{ title: "Thirty", name: "age", value: 30 },
		{ title: "Adults", name: "age", value: (row, value) => value >= 20 },
		{ title: "Unknown column", name: "missing", value: 1 }
	];
	const applyFilter = async (wrapper, n) => {
		await wrapper.findAll(".table-filter").at(n).trigger("click");
	};

	it("only shows the filter controls when filters are provided", async () => {
		expect((await build()).find(".table-filters").exists()).toBe(false);
		const wrapper = await build({ filters });
		expect(wrapper.findAll(".table-filter").wrappers.map(filter => filter.text())).toEqual([
			"Thirty",
			"Adults",
			"Unknown column"
		]);
	});

	it("filters by matching a value", async () => {
		const wrapper = await build({ filters });
		await applyFilter(wrapper, 0);
		expect(column(wrapper, 0)).toEqual(["Charlie"]);
	});

	it("filters with a custom function", async () => {
		const wrapper = await build({ filters });
		await applyFilter(wrapper, 1);
		expect(column(wrapper, 0)).toEqual(["Charlie", "Bob", "item2"]);
	});

	it("passes the row, value and position to a filter function", async () => {
		const value = jest.fn(() => true);
		const wrapper = await build({ filters: [{ title: "All", name: "age", value }] });
		await applyFilter(wrapper, 0);
		expect(value).toHaveBeenCalledWith(people[0], 30, 0);
	});

	it("matches nothing for a column that does not exist", async () => {
		const wrapper = await build({ filters });
		await applyFilter(wrapper, 2);
		expect(wrapper.find("tbody td").text()).toBe("No results");
	});

	it("filters from the full data set instead of the previous result", async () => {
		const wrapper = await build({ filters });
		await applyFilter(wrapper, 0);
		await applyFilter(wrapper, 1);
		expect(column(wrapper, 0)).toEqual(["Charlie", "Bob", "item2"]);
	});

	it("returns to page 1 and original order", async () => {
		const wrapper = await build({ filters, index: true });
		wrapper.vm.sort("name");
		await applyFilter(wrapper, 1);
		expect(wrapper.vm.currentPage).toBe(1);
		expect(wrapper.vm.sortColumn).toBe("#");
		expect(column(wrapper, 1)).toEqual(["Charlie", "Bob", "item2"]);
	});
});

describe("selection", () => {
	const rowCheckbox = (wrapper, n) => wrapper.findAll("tbody .custom-control").at(n);
	const selectAll = async (wrapper, checked) => {
		const input = wrapper.find("thead input[type=checkbox]");
		input.element.checked = checked;
		await input.trigger("change");
	};

	it("does not render checkboxes unless selectable", async () => {
		const wrapper = await build();
		expect(wrapper.find("input[type=checkbox]").exists()).toBe(false);
	});

	it("selects and deselects a row, emitting the selected rows", async () => {
		const wrapper = await build({ selectable: true });
		await rowCheckbox(wrapper, 1).trigger("click");
		expect(wrapper.emitted("selection-change").pop()).toEqual([[people[1]]]);
		expect(wrapper.findAll("tbody input").at(1).element.checked).toBe(true);
		await rowCheckbox(wrapper, 1).trigger("click");
		expect(wrapper.emitted("selection-change").pop()).toEqual([[]]);
		expect(wrapper.findAll("tbody input").at(1).element.checked).toBe(false);
	});

	it("selects every row on the current page only", async () => {
		const wrapper = await build({ selectable: true, data: numbered(25), perPage: 10 });
		await selectAll(wrapper, true);
		expect(wrapper.emitted("selection-change")).toHaveLength(1);
		expect(wrapper.emitted("selection-change")[0][0]).toHaveLength(10);
		expect(wrapper.vm.selected).toHaveLength(10);
		wrapper.vm.paginate(2);
		await flush();
		expect(wrapper.vm.allSelected).toBe(false);
		await selectAll(wrapper, true);
		expect(wrapper.vm.selected).toHaveLength(20);
	});

	it("does not duplicate rows that are already selected", async () => {
		const wrapper = await build({ selectable: true });
		await rowCheckbox(wrapper, 0).trigger("click");
		await selectAll(wrapper, true);
		expect(wrapper.vm.selected).toHaveLength(5);
	});

	it("deselects the current page with select all unchecked", async () => {
		const wrapper = await build({ selectable: true });
		await selectAll(wrapper, true);
		await selectAll(wrapper, false);
		expect(wrapper.vm.selected).toHaveLength(0);
		expect(wrapper.emitted("selection-change").pop()).toEqual([[]]);
	});

	it("checks the header checkbox once every row on the page is selected", async () => {
		const wrapper = await build({ selectable: true, data: people.slice(0, 2) });
		const header = () => wrapper.find("thead input[type=checkbox]").element.checked;
		expect(header()).toBe(false);
		await rowCheckbox(wrapper, 0).trigger("click");
		expect(header()).toBe(false);
		await rowCheckbox(wrapper, 1).trigger("click");
		expect(header()).toBe(true);
	});

	it("keeps the selection while searching, and sorting", async () => {
		const wrapper = await build({ selectable: true });
		await rowCheckbox(wrapper, 0).trigger("click");
		await wrapper.find("input[type=text]").setValue("char");
		await flush();
		expect(wrapper.findAll("tbody input").at(0).element.checked).toBe(true);
		await wrapper.find("input[type=text]").setValue("");
		await flush();
		await wrapper.findAll("thead th").at(1).trigger("click");
		const checked = wrapper.findAll("tbody tr").wrappers.filter(tr => tr.find("input").element.checked);
		expect(checked).toHaveLength(1);
		expect(checked[0].findAll("td").at(0).text()).toBe("Charlie");
	});

	it("clears the selection when the data is replaced", async () => {
		const wrapper = await build({ selectable: true });
		await rowCheckbox(wrapper, 0).trigger("click");
		await wrapper.setProps({ data: [{ name: "Zed", age: 1 }] });
		await flush();
		expect(wrapper.vm.selected).toHaveLength(0);
		expect(wrapper.find("tbody input").element.checked).toBe(false);
		expect(wrapper.emitted("selection-change").pop()).toEqual([[]]);
	});

	it("does not emit when replacing data with nothing selected", async () => {
		const wrapper = await build({ selectable: true });
		await wrapper.setProps({ data: [{ name: "Zed", age: 1 }] });
		await flush();
		expect(wrapper.emitted("selection-change")).toBeUndefined();
	});
});

describe("clicks", () => {
	it("is not styled as clickable without an onClick handler", async () => {
		const wrapper = await build();
		expect(wrapper.find("table").classes()).not.toContain("table-hover");
		expect(wrapper.find("tbody tr").classes()).not.toContain("clickable");
	});

	it("calls onClick with the row, value, column name and row position", async () => {
		const onClick = jest.fn();
		const wrapper = await build({ onClick });
		expect(wrapper.find("table").classes()).toContain("table-hover");
		expect(wrapper.find("tbody tr").classes()).toContain("clickable");
		await wrapper.findAll("tbody tr").at(2).findAll("td").at(1).trigger("click");
		expect(onClick).toHaveBeenCalledWith(people[2], 100, "age", 2);
	});

	it("does not throw when a cell is clicked without handlers", async () => {
		const wrapper = await build();
		await expect(wrapper.find("tbody td").trigger("click")).resolves.toBeUndefined();
	});

	it("calls a column's own click handler", async () => {
		const click = jest.fn();
		const wrapper = await build({
			columns: [{ name: "name", th: "Name", click }, { name: "age", th: "Age" }]
		});
		await wrapper.find("tbody td").trigger("click");
		expect(click).toHaveBeenCalledWith(people[0], "Charlie", "name", 0);
	});
});

describe("actions", () => {
	it("adds an actions column with a button for each action", async () => {
		const wrapper = await build({
			actions: [
				{ text: "Edit", color: "primary", size: "sm", action: jest.fn() },
				{ text: "Delete", color: "danger", size: "sm", action: jest.fn() }
			]
		});
		expect(wrapper.findAll("thead th").at(2).text()).toBe("Actions");
		const buttons = wrapper.findAll("tbody tr").at(0).findAll("button");
		expect(buttons.wrappers.map(button => button.text())).toEqual(["Edit", "Delete"]);
		expect(buttons.at(0).classes()).toEqual(expect.arrayContaining(["btn-primary", "btn-sm"]));
	});

	it("calls the action with the row and its index", async () => {
		const action = jest.fn();
		const wrapper = await build({ actions: [{ text: "Edit", action }] });
		await wrapper.findAll("tbody tr").at(3).find("button").trigger("click");
		expect(action).toHaveBeenCalledWith(people[3], 3);
	});

	it("evaluates show and disabled per row", async () => {
		const wrapper = await build({
			actions: [{
				text: "Edit",
				action: jest.fn(),
				show: row => row.age !== 100,
				disabled: row => row.age === 5
			}]
		});
		const rows = wrapper.findAll("tbody tr");
		expect(rows.at(0).find("button").exists()).toBe(true);
		expect(rows.at(0).find("button").attributes("disabled")).toBeUndefined();
		expect(rows.at(1).find("button").attributes("disabled")).toBe("disabled");
		expect(rows.at(2).find("button").exists()).toBe(false);
	});
});

describe("ajax", () => {
	const ajax = async (response, props = {}) => {
		Axios.get.mockResolvedValue({ data: response });
		return build({ ajax: true, url: "/users", data: [], ...props });
	};

	it("shows the loading state until the request completes", async () => {
		let resolve;
		Axios.get.mockReturnValue(new Promise(r => (resolve = r)));
		const wrapper = mount(DataTable, { propsData: { ajax: true, url: "/users", columns, index: false } });
		await flush();
		expect(wrapper.find(".data-table-loading").exists()).toBe(true);
		resolve({ data: { data: people } });
		await flush();
		expect(wrapper.find(".data-table-loading").exists()).toBe(false);
		expect(wrapper.findAll("tbody tr")).toHaveLength(5);
	});

	it("requests the given url", async () => {
		await ajax({ data: people });
		expect(Axios.get).toHaveBeenCalledTimes(1);
		expect(Axios.get.mock.calls[0][0]).toBe("/users");
	});

	it("sends the AjaxHeaders", async () => {
		await ajax({ data: people }, { AjaxHeaders: { Authorization: "Bearer token" } });
		expect(Axios.get.mock.calls[0][1]).toEqual({ headers: { Authorization: "Bearer token" } });
	});

	it("displays items from a { data: [] } response", async () => {
		const wrapper = await ajax({ data: people });
		expect(column(wrapper, 0)).toEqual(["Charlie", "alice", "Bob", "item10", "item2"]);
		expect(toastr.success).toHaveBeenCalledWith("Data Loaded");
	});

	it("displays items from a plain array response", async () => {
		const wrapper = await ajax(people);
		expect(column(wrapper, 0)).toEqual(["Charlie", "alice", "Bob", "item10", "item2"]);
		expect(toastr.error).not.toHaveBeenCalled();
	});

	it("reads items from the key given by ajaxKey", async () => {
		const wrapper = await ajax({ users: people }, { ajaxKey: "users" });
		expect(wrapper.findAll("tbody tr")).toHaveLength(5);
	});

	it("applies perPage to ajax data", async () => {
		const wrapper = await ajax(numbered(25), { perPage: 10 });
		expect(wrapper.findAll("tbody tr")).toHaveLength(10);
	});

	it("reports a response it cannot read", async () => {
		const wrapper = await ajax({ unexpected: true });
		expect(toastr.error).toHaveBeenCalledWith("Unable To Parse Data");
		expect(wrapper.find(".data-table-loading").exists()).toBe(false);
		expect(wrapper.find("tbody td").text()).toBe("No results");
	});

	it("reports a request failure using the error message", async () => {
		Axios.get.mockRejectedValue(new Error("Network Error"));
		const wrapper = await build({ ajax: true, url: "/users", data: [] });
		expect(toastr.error).toHaveBeenCalledWith("Network Error");
		expect(wrapper.find(".data-table-loading").exists()).toBe(false);
	});

	it("does not make a request when ajax is disabled", async () => {
		await build();
		expect(Axios.get).not.toHaveBeenCalled();
	});
});
