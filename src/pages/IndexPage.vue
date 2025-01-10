<template>
  <q-page class="q-pa-lg">
    <!-- Search Bar -->
    <div class="flex q-mb-lg q-ml-lg">
      <q-input
        v-model="searchTerm"
        label="Search properties..."
        outlined
        dense
        class="w-full"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>

        <template #append v-if="searchTerm || searchTerm.length">
          <q-icon name="clear" class="cursor-pointer" clickable />
        </template>
      </q-input>

      <q-checkbox
        v-model="filterByCategories"
        label="Allow additional filters"
      ></q-checkbox>

      <q-btn
        v-if="!filterByCategories"
        :label="searching ? '' : 'Search'"
        dense
        class="q-ml-lg q-px-md bg-secondary q-py-none text-white"
        no-caps
        @click="search"
        @keydown.enter="search"
      >
        <q-spinner-bars v-if="searching" thickness="2"></q-spinner-bars>
      </q-btn>

      <q-btn
        icon="tune"
        dense
        class="q-ml-lg q-px-md q-py-none"
        v-if="filterByCategories"
      >
        <q-tooltip>Filter</q-tooltip>

        <q-menu
          transition-show="flip-right"
          transition-hide="flip-left"
          :offset="[0, 20]"
          persistent
        >
          <p class="q-ml-md text-bold q-mt-xs">Filter Properties By:</p>
          <q-list
            style="max-width: 600px"
            v-for="option in options"
            :key="option.value"
          >
            <q-item>
              <q-item-section class="flex">
                <div>
                  <q-input
                    v-model.number="filterProperties[option.value]"
                    :label="option.label"
                    dense
                    type="number"
                    :rules="[
                      (val) => {
                        if (val) {
                          return typeof val === 'number' || 'Key in a number!';
                        }
                      },
                    ]"
                    reactive-rules
                  ></q-input>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator />

          <div class="flex justify-end q-px-md q-py-sm">
            <q-btn
              :label="searching ? '' : 'Apply'"
              class="bg-secondary q-px-md text-white"
              dense
              @click="search"
            ></q-btn>
          </div>
        </q-menu>
      </q-btn>

      <q-btn
        class="bg-grey q-ml-lg q-px-md text-white"
        label="Clear filters"
        dense
        @click="clearAllFilters"
      ></q-btn>
    </div>

    <!-- Property Cards -->
    <div class="row q-mx-auto">
      <q-card
        v-for="property in computedFilteredResuts"
        :key="property.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3 q-my-md q-mx-lg"
        flat
        bordered
        style="width: 45%"
      >
        <q-img
          :src="property.image"
          :alt="property.name"
          crossorigin="anonymous"
          style="object-fit: cover"
          height="20rem"
        />
        <q-card-section>
          <div class="text-h6">{{ property.name }}</div>
          <div class="text-subtitle2 text-primary">${{ property.price }}</div>
          <div class="text-caption">
            {{ property.bedrooms }} Bedrooms •
            {{ property.bathrooms }} Bathrooms
          </div>
          <div class="text-caption">
            {{ property.storeys }} Storeys • {{ property.garages }} Garages
          </div>
        </q-card-section>
        <!-- <q-card-actions align="right">
          <q-btn label="View Details" flat color="primary" />
        </q-card-actions> -->
      </q-card>
    </div>

    <div v-if="loading || searching" class="flex justify-center">
      <q-spinner-bars size="24px" class="q-mt-xl" />
    </div>

    <!-- No Results Found -->
    <div v-if="!searchResults.length && !loading" class="text-center q-mt-xl">
      <q-icon name="warning" size="64px" color="grey-6" />
      <p class="text-caption text-grey-6">No properties match your search.</p>
    </div>
  </q-page>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useSearchStore } from "src/stores/example-store";
import { computed, onMounted, ref } from "vue";

const searchStore = useSearchStore();
const { loading, searchResults, searching } = storeToRefs(searchStore);
const { searchProperties, getAllProperties } = useSearchStore();

const filterProperties = ref({
  bedrooms: "",
  bathrooms: "",
  garages: "",
  storeys: "",
});
const filterByCategories = ref(false);

const options = [
  {
    label: "Bedrooms",
    value: "bedrooms",
  },
  {
    label: "Bathrooms",
    value: "bathrooms",
  },
  {
    label: "Garages",
    value: "garages",
  },
  {
    label: "Storeys",
    value: "storeys",
  },
];

// Placeholder images for properties
const placeholderImages = [
  "https://media.istockphoto.com/id/457982209/photo/towels-on-bed-in-bedroom.jpg?s=612x612&w=0&k=20&c=yu5JRCaTxBCZ8e-K6bQPzoupAjnlAcGZ-k-boPJSD8E=",
  "https://media.istockphoto.com/id/512882668/photo/entering-hotel-room.jpg?s=612x612&w=0&k=20&c=dkStriVIj-19NVWg1AgHdBAtRGndus-sQJiZdo5N6ss=",
  "https://media.istockphoto.com/id/1392157204/photo/fashionable-woman-sitting-by-the-pool-on-the-empty-deck.jpg?s=612x612&w=0&k=20&c=5eQ8hk8gLpIU4vLmAA6rR-2Qp9L9tkMuPByRacM6kA0=",
  "https://media.istockphoto.com/id/641448082/photo/beautiful-tropical-beach-front-hotel-resort-with-swimming-pool-sunshine.jpg?s=612x612&w=0&k=20&c=9PyitcP743oS7oGAoSW8iGDjf1goapy40Ol7PcCNv24=",
  "https://media.istockphoto.com/id/119926339/photo/resort-swimming-pool.jpg?s=612x612&w=0&k=20&c=9QtwJC2boq3GFHaeDsKytF4-CavYKQuy1jBD2IRfYKc=",
  "https://media.istockphoto.com/id/591821200/photo/3d-rendering-luxury-hotel-reception-and-lounge.jpg?s=612x612&w=0&k=20&c=ujKL3aloZrbd87Q8fI8L6vTGJ_eAmfipVGxak-c4RTc=",
  "https://media.istockphoto.com/id/1418701619/photo/hotel-sign-on-building-facade-in-city-business-travel-and-tourism.jpg?s=612x612&w=0&k=20&c=W9UcZTYo3f8fTaiU_4xqfVSBOQRna-Pm-Prw3k54kyM=",
  "https://media.istockphoto.com/id/1453121644/photo/modern-hotel-room-with-double-bed-night-tables-and-day-sofa-bed.jpg?s=612x612&w=0&k=20&c=V2HSxLp0jrdeKvutjGZZEYpynjqdgdsAKHeIeUGKuoU=",
  "https://media.istockphoto.com/id/1418784247/photo/luxury-hotel-lobby.jpg?s=612x612&w=0&k=20&c=6acpCJL56bu5DMs8LwkdY246wlH2eRFci0MKVyycLJw=",
  "https://media.istockphoto.com/id/472899538/photo/downtown-cleveland-hotel-entrance-and-waiting-taxi-cab.jpg?s=612x612&w=0&k=20&c=rz-WSe_6gKfkID6EL9yxCdN_UIMkXUBsr67884j-X9o=",
];

const computedFilteredResuts = computed(() => {
  const filteredResults = searchResults.value.filter((property) => {
    // Apply filter conditions here
    // For example, filter properties based on filterProperties values
    // Replace the following condition with your actual filtering logic
    return true;
  });

  return filteredResults.map((property, index) => {
    property.image = placeholderImages[index % placeholderImages.length];
    return property;
  });
});

// Add image to properties if not present
onMounted(async () => {
  await getAllProperties();
});

// Search functionality
const searchTerm = ref("");

async function search() {
  let queryParams = {
    name: searchTerm.value,
  };

  if (filterByCategories.value) {
    Object.keys(filterProperties.value).filter((key) => {
      if (filterProperties.value[key] !== "") {
        queryParams[key] = filterProperties.value[key];
      }
    });
  }

  await searchProperties(queryParams);
}

async function clearAllFilters() {
  Object.keys(filterProperties).filter((key) => {
    filterProperties.value[key] = "";
  });
  searchTerm.value = "";
  filterByCategories.value = false;
  await getAllProperties();
}
</script>

<style>
/* .property-image {
  border-bottom: 1px solid var(--q-color-grey-4);
} */
</style>
