import { svgIconFactory } from './icon-factory';

function Lock() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 35 35" fill="null" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.0337 12.1892V14.491H20.9526V12.1892C20.9526 10.2839 19.406 8.73725 17.4932 8.72975C15.5925 8.72975 14.0337 10.2824 14.0337 12.1892Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 17.5V17.4977C0.00128484 7.8336 7.83592 0 17.5 0C27.165 0 35 7.83502 35 17.5C35 27.165 27.165 35 17.5 35C7.83502 35 0 27.165 0 17.5ZM22.6892 14.491H23.8377C24.4804 14.491 25 15.0086 25 15.6351V24.8559C25 25.4824 24.4804 26 23.8377 26H11.1486C10.5196 26 10 25.4824 10 24.8559V15.6351C10 15.0086 10.5196 14.491 11.1486 14.491H12.2972V12.1892C12.2972 9.30179 14.608 7 17.4932 7C20.3797 7 22.6892 9.30179 22.6892 12.1892V14.491Z"
        fill="currentColor"
      />
    </svg>
  );
}

export const LockIcon = svgIconFactory(Lock);
