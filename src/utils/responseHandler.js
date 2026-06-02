const responseHandler = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

responseHandler.success = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

responseHandler.error = (res, message = 'Error', statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

module.exports = responseHandler;
