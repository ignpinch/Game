import React, { useState, useEffect, useRef } from 'react';
import Bird from '../assets/bird.png';
import BirdGameOver from '../assets/birdgameover.png';
import LungTube from '../assets/lungtube.png';
import Cloud from '../assets/cloud.png';
import ExplosionSound from '../assets/explosion.mp3';  // Import the explosion sound
import BgMusic from '../assets/bgmusic.mp3';  // Import the background music

function Game() {
  const birdHeight = 40;
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;

  const [birdY, setBirdY] = useState(screenHeight / 2 - birdHeight / 2);
  const [velocity, setVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [angle, setAngle] = useState(0);
  const [tubes, setTubes] = useState([]);
  const [clouds, setClouds] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gravity = 0.6;
  const initialUpwardVelocity = -8;
  const jumpStrength = -8;
  const maxAngle = 20;
  const tubeWidth = 100;
  const tubeGap = 220;
  const tubeSpeed = 5;
  const cloudSpeed = 4;

  // Create a ref for the explosion sound and background music
  const explosionSoundRef = useRef(new Audio(ExplosionSound));
  const bgMusicRef = useRef(new Audio(BgMusic));  // Create a ref for the background music

  // Set background music volume to 30% (0.3) and play it automatically
  useEffect(() => {
    bgMusicRef.current.volume = 0.3;  // Set the volume
    bgMusicRef.current.loop = true;  // Set to loop the background music
    bgMusicRef.current.play();  // Play the music automatically when the component mounts

    return () => {
      bgMusicRef.current.pause();  // Pause music when component unmounts
    };
  }, []);  // Empty dependency array ensures this effect runs once when the component mounts

  const getRandomTubeHeight = () => {
    return Math.floor(Math.random() * (screenHeight - tubeGap));
  };

  const getRandomCloudPosition = () => {
    return Math.floor(Math.random() * (screenHeight - 100));
  };

  const detectCollision = () => {
    const birdLeft = screenWidth / 2 - 45;
    const birdRight = screenWidth / 2 + 45;
    const birdTop = birdY;
    const birdBottom = birdY + birdHeight;

    for (const tube of tubes) {
      const tubeLeft = tube.x;
      const tubeRight = tube.x + tubeWidth;

      const upperTubeBottom = tube.topHeight;
      if (
        birdRight > tubeLeft &&
        birdLeft < tubeRight &&
        birdTop < upperTubeBottom
      ) {
        setGameOver(true);
        return;
      }

      const lowerTubeTop = tube.topHeight + tubeGap;
      const lowerTubeBottom = screenHeight;
      if (
        birdRight > tubeLeft &&
        birdLeft < tubeRight &&
        birdBottom > lowerTubeTop
      ) {
        setGameOver(true);
        return;
      }
    }
  };

  useEffect(() => {
    const cloudInterval = setInterval(() => {
      setClouds((prevClouds) => {
        const newCloud = {
          x: screenWidth,
          y: getRandomCloudPosition(),
        };
        return [...prevClouds, newCloud];
      });
    }, 1000 / 9);

    const moveCloudsInterval = setInterval(() => {
      setClouds((prevClouds) => {
        return prevClouds
          .map((cloud) => ({
            ...cloud,
            x: cloud.x - cloudSpeed,
          }))
          .filter((cloud) => cloud.x > -100);
      });
    }, 1000 / 60);

    return () => {
      clearInterval(cloudInterval);
      clearInterval(moveCloudsInterval);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const tubeInterval = setInterval(() => {
      setTubes((prevTubes) => {
        const newTube = {
          x: screenWidth,
          topHeight: getRandomTubeHeight(),
        };
        return [...prevTubes, newTube];
      });
    }, 1000 / 0.4);

    const moveTubesInterval = setInterval(() => {
      setTubes((prevTubes) => {
        prevTubes.forEach((tube, index) => {
          if (tube.x + tubeWidth <= screenWidth / 2 && !tube.passed) {
            setScore((prevScore) => prevScore + 1);
            prevTubes[index].passed = true;
          }
        });

        return prevTubes
          .map((tube) => ({
            ...tube,
            x: tube.x - tubeSpeed,
          }))
          .filter((tube) => tube.x + tubeWidth > 0);
      });
    }, 900 / 50);

    return () => {
      clearInterval(tubeInterval);
      clearInterval(moveTubesInterval);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver) {
      explosionSoundRef.current.play();
    }
  }, [gameOver]);

  const handleKeyPress = (event) => {
    if (event.key === ' ' && !gameStarted && !gameOver) {
      setGameStarted(true);
      setVelocity(initialUpwardVelocity);
    } else if (event.key === ' ' && gameStarted) {
      jump();
    }
  };

  const handleJump = () => {
    if (gameStarted && !gameOver) {
      jump();
    } else if (!gameStarted && !gameOver) {
      setGameStarted(true);
      setVelocity(initialUpwardVelocity);
    }
  };

  const jump = () => {
    setVelocity(jumpStrength);
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 200);
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setBirdY(screenHeight / 2 - birdHeight / 2);
    setVelocity(0);
    setTubes([]);
    setClouds([]);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  return (
    <div className="flex items-center h-screen flex-col overflow-y-hidden">
      <div className='w-full bg-blue-200 p-2'></div>

      <div
        className="relative bg-white w-full h-screen overflow-hidden"
        style={{
          height: screenHeight,
          maxWidth: '100vw',
          margin: '0 auto',
        }}
        onClick={handleJump}
      >
        <span
          className="absolute left-[50%] top-[20%] text-[100px] opacity-60 z-10"
          style={{ transform: 'translateX(-50%)' }}
        >
          {score}
        </span>

        {clouds.map((cloud, index) => (
          <img
            key={index}
            src={Cloud}
            alt="Cloud"
            className="absolute"
            style={{
              top: cloud.y,
              left: cloud.x,
              width: '150px',
              height: '80px',
              objectFit: 'cover',
              opacity: '40%',
            }}
          />
        ))}

        {!gameStarted && !gameOver && (
          <div
            className="absolute w-full h-full flex items-center justify-center text-4xl font-bold"
            style={{ zIndex: 10 }}
          >
            <span className='absolute top-[55%] text-[25px] opacity-50 text-blue-700'>
              TAP TO PLAY
            </span>
          </div>
        )}

        {gameOver && (
          <div
            className="absolute w-full h-full flex items-center justify-center text-4xl font-bold"
            style={{ zIndex: 10 }}
          >
            <span className='absolute top-[55%] text-[25px] opacity-80 text-red-700'>
              GAME OVER
            </span>
          </div>
        )}

        <img
          src={gameOver ? BirdGameOver : Bird}
          alt="Bird"
          className="absolute"
          style={{
            top: gameStarted ? birdY : '50%',
            left: '50%',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            width: '90px',
            height: '30px',
          }}
        />

        {tubes.map((tube, index) => (
          <React.Fragment key={index}>
            <img
              src={LungTube}
              alt="Upper Tube"
              className="absolute"
              style={{
                top: 0,
                left: tube.x,
                width: tubeWidth,
                height: tube.topHeight,
                objectFit: 'cover',
                transform: 'rotate(180deg)',
              }}
            />
            <img
              src={LungTube}
              alt="Lower Tube"
              className="absolute"
              style={{
                top: tube.topHeight + tubeGap,
                left: tube.x,
                width: tubeWidth,
                height: screenHeight - tube.topHeight - tubeGap,
                objectFit: 'cover',
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {gameOver && (
        <div className="absolute w-full h-screen flex items-center justify-center z-20">
          <button
            onClick={restartGame}
            className="absolute top-[62%] text-lg font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      <div className='w-full bg-blue-200 p-2'></div>
    </div>
  );
}

export default Game;
