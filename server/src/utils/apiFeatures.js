class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

 filter() {
  const queryObj = { ...this.queryString };
  const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
  excludedFields.forEach(el => delete queryObj[el]);

  let mongoQuery = {};

  for (let key in queryObj) {
    if (typeof queryObj[key] === 'object') {
      mongoQuery[key] = {};
      for (let op in queryObj[key]) {
        // Convert string to number if possible
        const value = queryObj[key][op];
        mongoQuery[key]['$' + op] = isNaN(value) ? value : Number(value);
      }
    } else {
      mongoQuery[key] = queryObj[key];
    }
  }

  // Handle full-text search if 'search' is provided
  if (this.queryString.search) {
    mongoQuery.$text = { $search: this.queryString.search };
  }

  this.query = this.query.find(mongoQuery);
  return this;
}

sort() {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('-createdAt');
    return this;
  }
  fieldsLimit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); 
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIfeatures;