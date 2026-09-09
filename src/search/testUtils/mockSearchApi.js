// Records calls and replays a scripted sequence of resolutions/rejections,
// standing in for jest.fn()/jest.mock() since Jest isn't installed here.

function createMockSearchApi(steps) {
  const calls = [];
  return {
    calls,
    searchRestaurants(query) {
      calls.push(query);
      const step = steps[Math.min(calls.length - 1, steps.length - 1)];
      return step.error ? Promise.reject(step.error) : Promise.resolve(step.results);
    },
  };
}

module.exports = { createMockSearchApi };
