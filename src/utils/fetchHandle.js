export const fetchRaw = async (url) => {
  const res = await fetch(url).then((response) => {
    return response;
  })
  return res;
} 