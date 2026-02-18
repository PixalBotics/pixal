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
    // Validate model
    if (!model || typeof model.find !== 'function') {
      throw new Error('Invalid model provided to paginate function');
    }

    // Extract query parameters with validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = (req.query.search || '').trim();
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

    // Execute queries with error handling
    let data, total;
    try {
      [data, total] = await Promise.all([
        model.find(searchQuery)
          .sort(sortBy)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        model.countDocuments(searchQuery).exec()
      ]);
    } catch (dbError) {
      console.error('Database query error in pagination:', dbError);
      throw new Error('Failed to fetch data from database');
    }

    // Calculate metadata
    const totalPages = Math.ceil(total / limit) || 0;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: data || [],
      pagination: {
        total: total || 0,
        count: data ? data.length : 0,
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
    console.error('Pagination error:', error);
    throw error;
  }
};

module.exports = { paginate };

