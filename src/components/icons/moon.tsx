import { svgIconFactory } from './icon-factory';

function Moon() {
  return (
    <svg width="22px" height="22px" viewBox="0 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <title>moon</title>
      <defs>
        <path
          d="M11.0243174,9.76102191 C11.0243174,13.7455237 14.2543331,16.9756006 18.2387595,16.9756006 C19.1009964,16.9756006 19.9279044,16.824337 20.6943958,16.5468981 C19.690607,19.3214721 17.0319089,21.3043478 13.9100942,21.3043478 C9.92566791,21.3043478 6.69565217,18.0742709 6.69565217,14.0897691 C6.69565217,10.9678953 8.67849038,8.30914692 11.4534586,7.30425472 C11.1756579,8.07140905 11.0243174,8.89854141 11.0243174,9.76102191 Z"
          id="path-1"
        ></path>
        <filter x="-10.7%" y="-10.7%" width="121.4%" height="121.4%" filterUnits="objectBoundingBox" id="filter-2">
          <feGaussianBlur stdDeviation="1" in="SourceAlpha" result="shadowBlurInner1"></feGaussianBlur>
          <feOffset dx="-1" dy="1" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
          <feComposite
            in="shadowOffsetInner1"
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="shadowInnerInner1"
          ></feComposite>
          <feColorMatrix
            values="0 0 0 0 1   0 0 0 0 0.926312217   0 0 0 0 0.672089367  0 0 0 1 0"
            type="matrix"
            in="shadowInnerInner1"
          ></feColorMatrix>
        </filter>
      </defs>
      <g id="Wormhole" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="moon">
          <circle id="椭圆形" fill="#5446D6" cx="14" cy="14" r="14"></circle>
          <g id="形状结合">
            <use fill="#F7CF45" fillRule="evenodd" xlinkHref="#path-1"></use>
            <use fill="black" fillOpacity="1" filter="url(#filter-2)" xlinkHref="#path-1"></use>
          </g>
        </g>
      </g>
    </svg>
  );
}

export const MoonIcon = svgIconFactory(Moon);
