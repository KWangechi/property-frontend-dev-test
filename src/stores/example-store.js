import { defineStore } from "pinia";
import { api } from "src/boot/axios";

export const useSearchStore = defineStore("search", {
  state: () => ({
    searchResults: [],
    loading: false,
    searching: false,
  }),
  getters: {
    getSearchResults() {
      return this.searchResults;
    },
  },
  actions: {
    async getAllProperties() {
      this.loading = true;

      try {
        const { data } = await api.get("properties");

        this.searchResults = data.properties;
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.error("Error fetching properties:", error);
      }
      // this.searchResults = ["Property 1", "Property 2", "Property 3"];
    },

    async searchProperties(queryParams) {
      this.searching = true;

      try {
        const { data } = await api.get("search", {
          params: queryParams,
        });

        this.searchResults = data.properties;
        this.searching = false;
      } catch (error) {
        console.error("Error searching properties:", error);
        this.searching = false;
      }
      // this.searchResults = ["Property 1", "Property 2", "Property 3"];
    },
  },
});
