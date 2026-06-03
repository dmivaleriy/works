// Functionality to play/pause on hover with overlay support
const container = document.querySelector('.video-container');
const video = container.querySelector('.video');
const overlay = container.querySelector('.overlay');

container.addEventListener('mouseenter', () => {
  video.play();
  overlay.style.opacity = '0'; // Hide overlay
});

container.addEventListener('mouseleave', () => {
  video.pause();
  video.currentTime = 0; // Reset video
  overlay.style.opacity = '1'; // Show overlay
});
