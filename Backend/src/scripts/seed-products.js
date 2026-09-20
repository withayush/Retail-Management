require("dotenv").config();

const axios = require("axios");
const products = require("./data/products");

const BASE_URL =
  process.env.SEED_API_URL || "http://localhost:3001";

const IDENTIFIER = process.env.SEED_IDENTIFIER;
const PASSWORD = process.env.SEED_PASSWORD;

/**
 * Get a readable error message from an Axios/API error.
 */
function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.errors?.[0]?.message ||
    error.message ||
    "Unknown error"
  );
}

/**
 * Login to VendorOS.
 *
 * Login API expects:
 *
 * {
 *   identifier: "...",
 *   password: "..."
 * }
 *
 * Supports both:
 * - JWT returned in response
 * - HttpOnly authentication cookie
 */
async function login() {
  console.log("\n[1/5] Logging in...");

  const response = await axios.post(
    `${BASE_URL}/api/auth/login`,
    {
      identifier: IDENTIFIER,
      password: PASSWORD,
    }
  );

  const body = response.data;

  /*
   * Try all common token locations used
   * by the VendorOS authentication response.
   */
  const token =
    body.accessToken ||
    body.data?.accessToken ||
    body.token ||
    body.data?.token ||
    null;

  /*
   * Also support cookie-based authentication.
   */
  const setCookie =
    response.headers["set-cookie"];

  const cookie = Array.isArray(setCookie)
    ? setCookie
        .map(
          (value) =>
            value.split(";")[0]
        )
        .join("; ")
    : null;

  /*
   * Login succeeded only if we received
   * either a token or authentication cookie.
   */
  if (!token && !cookie) {
    console.log("\nLogin response:");

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    throw new Error(
      "Login succeeded, but no access token or authentication cookie was found."
    );
  }

  console.log("Login successful.");

  return {
    token,
    cookie,
  };
}

/**
 * Build authentication headers.
 */
function buildAuthHeaders(auth) {
  const headers = {};

  /*
   * JWT authentication.
   */
  if (auth.token) {
    headers.Authorization =
      `Bearer ${auth.token}`;
  }

  /*
   * Cookie authentication.
   */
  if (auth.cookie) {
    headers.Cookie =
      auth.cookie;
  }

  return headers;
}

/**
 * Fetch categories belonging to
 * the authenticated business.
 */
async function getCategories(auth) {
  console.log(
    "\n[2/5] Fetching categories..."
  );

  const response = await axios.get(
    `${BASE_URL}/api/categories`,
    {
      headers:
        buildAuthHeaders(auth),
    }
  );

  /*
   * Support the possible response structures:
   *
   * {
   *   data: [...]
   * }
   *
   * or
   *
   * {
   *   categories: [...]
   * }
   *
   * or
   *
   * [...]
   */
  const categories =
    response.data?.data ||
    response.data?.categories ||
    response.data;

  if (!Array.isArray(categories)) {
    console.log(
      "\nCategories API response:"
    );

    console.log(
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    throw new Error(
      "Could not find categories array in API response."
    );
  }

  console.log(
    `Categories found: ${categories.length}`
  );

  return categories;
}

/**
 * Convert categories into a Map.
 *
 * Example:
 *
 * "dairy & milk"
 *      ↓
 * "68abc123..."
 *
 * "biscuits & snacks"
 *      ↓
 * "68abc456..."
 */
function createCategoryMap(
  categories
) {
  console.log(
    "\n[3/5] Creating category map..."
  );

  const categoryMap =
    new Map();

  for (
    const category of categories
  ) {
    if (
      !category?.name ||
      !category?._id
    ) {
      continue;
    }

    categoryMap.set(
      category.name
        .trim()
        .toLowerCase(),
      category._id
    );
  }

  console.log(
    `Category map created: ${categoryMap.size} categories`
  );

  return categoryMap;
}

/**
 * Create one product.
 *
 * The dummy data contains:
 *
 * category: "Dairy & Milk"
 *
 * The API needs:
 *
 * categoryId: "68abc123..."
 *
 * This function automatically
 * performs that conversion.
 */
async function createProduct(
  auth,
  product,
  categoryMap
) {
  /*
   * Normalize category name so
   * casing and extra spaces don't
   * cause lookup failures.
   */
  const normalizedCategory =
    product.category
      .trim()
      .toLowerCase();

  /*
   * Find the real MongoDB
   * category ID.
   */
  const categoryId =
    categoryMap.get(
      normalizedCategory
    );

  /*
   * Stop this product if its
   * category does not exist.
   */
  if (!categoryId) {
    throw new Error(
      `Category not found: "${product.category}"`
    );
  }

  /*
   * Build the exact payload
   * expected by POST /api/products.
   */
  const payload = {
    name: product.name,

    sku: product.sku,

    barcode:
      product.barcode ?? null,

    sellingPrice:
      product.sellingPrice,

    costPrice:
      product.costPrice,

    categoryId,

    unit:
      product.unit,

    packSize:
      product.packSize,

    packagingType:
      product.packagingType,

    description:
      product.description,

    isActive:
      product.isActive ?? true,
  };

  /*
   * Send product to the actual
   * VendorOS Product API.
   */
  return axios.post(
    `${BASE_URL}/api/products`,
    payload,
    {
      headers:
        buildAuthHeaders(auth),
    }
  );
}

/**
 * Main product seeding process.
 */
async function seedProducts() {
  console.log(
    "========================================"
  );

  console.log(
    "VendorOS Product Seeder"
  );

  console.log(
    "========================================"
  );

  /*
   * Validate environment variables.
   */
  if (
    !IDENTIFIER ||
    !PASSWORD
  ) {
    console.error(
      "\nSEED_IDENTIFIER or SEED_PASSWORD is missing in .env"
    );

    console.error(
      "\nRequired .env configuration:"
    );

    console.error(
      "SEED_IDENTIFIER=your-login-email-or-phone"
    );

    console.error(
      "SEED_PASSWORD=your-password"
    );

    console.error(
      "SEED_API_URL=http://localhost:3001"
    );

    process.exit(1);
  }

  try {
    /*
     * ====================================
     * STEP 1
     * Login
     * ====================================
     */
    const auth =
      await login();

    /*
     * ====================================
     * STEP 2
     * Get categories
     * ====================================
     */
    const categories =
      await getCategories(
        auth
      );

    /*
     * ====================================
     * STEP 3
     * Build category map
     * ====================================
     */
    const categoryMap =
      createCategoryMap(
        categories
      );

    /*
     * Display categories so we can
     * immediately verify that the
     * correct business categories
     * were loaded.
     */
    console.log(
      "\nAvailable categories:"
    );

    for (
      const category of categories
    ) {
      console.log(
        `- ${category.name} -> ${category._id}`
      );
    }

    /*
     * ====================================
     * STEP 4
     * Create products
     * ====================================
     */
    console.log(
      "\n[4/5] Starting product creation..."
    );

    console.log(
      `Products to create: ${products.length}`
    );

    let created = 0;
    let failed = 0;

    /*
     * Create products one by one.
     *
     * Sequential processing is intentional
     * for the first seed/test run because
     * it makes API errors easy to identify.
     */
    for (
      const product of products
    ) {
      try {
        await createProduct(
          auth,
          product,
          categoryMap
        );

        created++;

        console.log(
          `✓ Created: ${product.name}`
        );
      } catch (error) {
        failed++;

        console.log(
          `✗ Failed: ${product.name}`
        );

        console.log(
          `  Reason: ${getErrorMessage(error)}`
        );
      }
    }

    /*
     * ====================================
     * STEP 5
     * Final report
     * ====================================
     */
    console.log(
      "\n[5/5] Seeding completed"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Created : ${created}`
    );

    console.log(
      `Failed  : ${failed}`
    );

    console.log(
      `Total   : ${products.length}`
    );

    console.log(
      "========================================"
    );

    /*
     * If any product failed, make the
     * command return a failure status.
     */
    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      "\nSEEDING FAILED"
    );

    console.error(
      getErrorMessage(error)
    );

    /*
     * Display the complete API response
     * when available. This is useful while
     * debugging the first seed run.
     */
    if (error.response?.data) {
      console.error(
        "\nAPI response:"
      );

      console.error(
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    process.exit(1);
  }
}

/*
 * Start seeding.
 */
seedProducts();