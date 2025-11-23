function createError(message, status) {
	return Object.assign(new Error(message), { status });
}
export default createError;
