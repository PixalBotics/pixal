/**
 * Pagination and search utility for MongoDB queries
 * @param {Object} model - Mongoose model
 * @param {Object} req - Express request object
 * @param {Object} searchFields - Fields to search in (e.g., ['name', 'description'])
 * @param {Object} additionalFilters - Additional filters to apply
 * @returns {Object} - Paginated results with metadata
 */
const paginate = async (model, req, searchFields = [], additionalFilters = {}) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || '-createdAt';

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = { ...additionalFilters };
    
    if (search && searchFields.length > 0) {
      searchQuery.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    // Execute queries
    const [data, total] = await Promise.all([
      model.find(searchQuery)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      model.countDocuments(searchQuery)
    ]);

    // Calculate metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data,
      pagination: {
        total,
        count: data.length,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { paginate };

