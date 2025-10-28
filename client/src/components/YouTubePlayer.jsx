import React, { useState, useEffect } from 'react';
import '../styles/YouTubePlayer.css';

const YouTubePlayer = ({ videoId, title, autoplay = false, width = "100%", height = "315" }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        setIsLoaded(true);
      };
    } else {
      setIsLoaded(true);
    }
  }, []);

  if (!videoId) {
    return (
      <div className="youtube-error">
        <p>No video ID provided</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1${autoplay ? '&autoplay=1' : ''}`;

  return (
    <div className="youtube-player-container">
      <div className="youtube-video-wrapper">
        <iframe
          width={width}
          height={height}
          src={embedUrl}
          title={title || 'YouTube Video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && <h3 className="youtube-video-title">{title}</h3>}
    </div>
  );
};

export default YouTubePlayer;
