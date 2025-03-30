/**
 * Formats milliseconds into a MM:SS format
 * @param ms Milliseconds to format
 */
export const formatTime = (ms: number): string => {
  if (ms <= 0) return "00:00";

  // Convert milliseconds to seconds
  const totalSeconds = Math.floor(ms / 1000);

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
};
