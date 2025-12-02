// ِA Wrapper function to uncapsulate all asnyc function in the routes (closure)
const catchAsync = (fn) => {
   return (req, res, next) => {
      fn(req, res, next).catch(next);
   };
};

export default catchAsync;
