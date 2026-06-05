const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export default async function analyseFarm(
  image: File,
  location: string,
  county?: string,
  acres?: string
) {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("location", location.trim());
  if (county?.trim()) formData.append("county", county.trim());
  if (acres?.trim()) formData.append("land_acres", acres.trim());

  const response = await fetch(`${BASE_URL}/farm/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `Server error ${response.status}`);
  return data;
}