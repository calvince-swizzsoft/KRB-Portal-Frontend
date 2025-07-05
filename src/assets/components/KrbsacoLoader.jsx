import React from 'react';
import styled, { keyframes } from 'styled-components';

// Pulse animation for the bars
const bounce = keyframes`
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.8);
  }
`;

const LoaderWrapper = styled.div`
  background: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Bars = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 20px;
`;

const Bar = styled.div`
  width: 6px;
  height: 40px;
  background-color: #196019;
  animation: ${bounce} 1s infinite ease-in-out;
  animation-delay: ${({ delay }) => delay}s;
  border-radius: 4px;
`;

const KrbsacoText = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.8rem;
  font-weight: bold;
  color: #196019;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #a3e63533;
`;

const KrbsacoLoader = () => {
  return (
    <LoaderWrapper>
      <KrbsacoText>KRBSACCO</KrbsacoText>
      <Bars>
        {[0, 0.2, 0.4, 0.6, 0.8].map((delay, index) => (
          <Bar key={index} delay={delay} />
        ))}
      </Bars>
    </LoaderWrapper>
  );
};

export default KrbsacoLoader;
