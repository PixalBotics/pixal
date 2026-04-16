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
    const fetchAll = String(req.query.all || '').toLowerCase() === 'true';

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
        (() => {
          const query = model.find(searchQuery).sort(sortBy);
          if (!fetchAll) {
            query.skip(skip).limit(limit);
          }
          return query.lean().exec();
        })(),
        model.countDocuments(searchQuery).exec()
      ]);
    } catch (dbError) {
      console.error('Database query error in pagination:', dbError);
      throw new Error('Failed to fetch data from database');
    }

    // Calculate metadata
    const effectiveLimit = fetchAll ? (total || 0) : limit;
    const totalPages = fetchAll ? (total > 0 ? 1 : 0) : (Math.ceil(total / limit) || 0);
    const hasNextPage = fetchAll ? false : page < totalPages;
    const hasPrevPage = fetchAll ? false : page > 1;

    return {
      success: true,
      data: data || [],
      pagination: {
        total: total || 0,
        count: data ? data.length : 0,
        page: fetchAll ? 1 : page,
        limit: effectiveLimit,
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

