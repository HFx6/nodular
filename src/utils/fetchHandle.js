export const fetchRaw = async (url) => {
  console.log("Fetch worked");
  const res = await fetch(url).then((response) => {
    return response;
  })
  return res;
} 