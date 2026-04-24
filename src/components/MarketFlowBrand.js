import React from 'react';

const marketGradient = {
  backgroundImage: 'linear-gradient(180deg, #f7f9fd 0%, #dce4ef 58%, #95a2b5 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

const flowGradient = {
  backgroundImage: 'linear-gradient(135deg, #8cecff 0%, #1dc9ff 42%, #15c7d7 72%, #0fe2a1 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

export function MarketFlowMark({
  size = 38,
  radius = 11,
  padding = 2,
  border = '1px solid rgba(68, 214, 255, 0.2)',
  background = 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), rgba(5, 12, 20, 0.88)',
  shadow = '0 14px 34px rgba(0, 0, 0, 0.32)',
  style = {},
  imageStyle = {},
  alt = 'MarketFlow',
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        border,
        background,
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <img
        src="/logo192.png"
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding,
          ...imageStyle,
        }}
      />
    </div>
  );
}

export function MarketFlowWordmark({
  titleSize = 18,
  subtitle = 'Journal',
  subtitleSize = 10,
  align = 'left',
  titleFamily = "'Space Grotesk', sans-serif",
  titleWeight = 800,
  titleLetterSpacing = '-0.04em',
  subtitleLetterSpacing = '0.16em',
  titleStyle = {},
  subtitleStyle = {},
  flowStyle = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: align }}>
      <div
        style={{
          fontFamily: titleFamily,
          fontSize: titleSize,
          fontWeight: titleWeight,
          letterSpacing: titleLetterSpacing,
          color: '#f1f5fc',
          ...titleStyle,
        }}
      >
        <span style={marketGradient}>Market</span>
        <span style={{ ...flowGradient, ...flowStyle }}>Flow</span>
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 3,
            fontSize: subtitleSize,
            fontWeight: 700,
            letterSpacing: subtitleLetterSpacing,
            textTransform: 'uppercase',
            color: 'rgba(125, 147, 178, 0.88)',
            ...subtitleStyle,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export default function MarketFlowBrand({
  gap = 12,
  align = 'left',
  subtitle = 'Journal',
  markProps = {},
  wordmarkProps = {},
  style = {},
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}>
      <MarketFlowMark {...markProps} />
      <MarketFlowWordmark align={align} subtitle={subtitle} {...wordmarkProps} />
    </div>
  );
}
