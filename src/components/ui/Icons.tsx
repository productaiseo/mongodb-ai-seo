type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {

  Logo: (props: IconProps) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="333"
      height="333"
      viewBox="0 0 250 250"
      {...props}
    >
      <path d="M14 31v23h18v190h77l.2-32.2.3-32.3h33l.3 32.2.2 32.3h77V54h18V8h-95v67h-34V8H14zm50.8-6.2L93 25v66h66V25h63v12.9l-9 .3-9 .3-.3 94.5-.2 94.5-22.2.3-22.3.2v-65H93v63.8l-6.2.7c-3.5.3-13.4.5-22.1.3l-15.7-.3V38H30v-6.3c0-3.5.2-6.6.5-6.8.2-.3 1.7-.4 3.2-.3 1.5 0 15.5.2 31.1.2" fill={props?.color} />
      <path d="M62 79v41h127.5l.3-25.3c.2-13.8 0-32.3-.4-41l-.6-15.7H173v66H79V38H62zm3.2 54.8-3.2.3.2 40.2.3 40.2 8.3.3 8.2.3V150h94v65.1l8.3-.3 8.2-.3.3-29.5c.2-16.2 0-34.5-.3-40.6l-.7-11.1-60.1.1c-33.1.1-61.7.2-63.5.4" fill={props?.color} />
    </svg>
  ),

  Location: (props: IconProps) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="800"   
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m12 24-.7-.6C11 23.1 3 16.5 3 9c0-5 4-9 9-9s9 4 9 9c0 7.5-8 14.1-8.3 14.4zm0-22C8.1 2 5 5.1 5 9c0 5.4 5.1 10.5 7 12.3 1.9-1.8 7-6.9 7-12.3 0-3.9-3.2-7-7-7m0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"
      fill="currentColor"
      />
    </svg>
  ),

  Phone: (props: IconProps) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24"
      width="24" height="24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92"
      />
    </svg>
  ),

  ThumbsUp: (props: IconProps) => (
    <svg 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>

      <path d="M7 10v12m8-16.12L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
    </svg>
  ),

  ThumbsUpFilled: (props: IconProps) => (
    <svg 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
      fill="#30B9FC"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>

      <path d="M7 10v12m8-16.12L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
    </svg>
  ),

  CommentCircle: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="800"
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M16 26c-1.168 0-2.296-.136-3.38-.367l-4.708 2.83.063-4.639C4.366 21.654 2 18.066 2 14 2 7.373 8.268 2 16 2s14 5.373 14 12c0 6.628-6.268 12-14 12m0-26C7.164 0 0 6.269 0 14c0 4.419 2.345 8.354 6 10.919V32l7.009-4.253c.97.16 1.968.253 2.991.253 8.836 0 16-6.268 16-14 0-7.731-7.164-14-16-14m7 11H9a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2m-2 6H11a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2" fillRule="evenodd"/>
    </svg>
  ),

  WebLink: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="4 4 16 16"
      fill="currentColor"
    >
      <path d="M5.636 5.636a4 4 0 0 1 5.657 0l2.828 2.828a4 4 0 0 1 0 5.657 1 1 0 1 1-1.414-1.414 2 2 0 0 0 0-2.828L9.88 7.05a2 2 0 0 0-2.83 2.83l.707.707A1 1 0 1 1 6.343 12l-.707-.707a4 4 0 0 1 0-5.657m5.657 4.243a1 1 0 0 1 0 1.414 2 2 0 0 0 0 2.828l2.828 2.829a2 2 0 0 0 2.829-2.829l-.707-.707A1 1 0 1 1 17.657 12l.707.707a4 4 0 0 1-5.657 5.657L9.88 15.536a4 4 0 0 1 0-5.657 1 1 0 0 1 1.414 0" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  ),

  Admin: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="800" height="800"
      viewBox="0 0 1920 1920"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="10"
    >
      <g strokeWidth="0"/>
      <g strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M276.941 440.584v565.722c0 422.4 374.174 625.468 674.71 788.668l8.02 4.292 8.131-4.292c300.537-163.2 674.71-366.268 674.71-788.668V440.584l-682.84-321.657L276.94 440.584Zm682.73 1479.529c-9.262 0-18.523-2.372-26.993-6.89l-34.9-18.974C588.095 1726.08 164 1495.906 164 1006.306V404.78c0-21.91 12.65-41.788 32.414-51.162L935.727 5.42c15.134-7.228 32.866-7.228 48 0l739.313 348.2c19.765 9.374 32.414 29.252 32.414 51.162v601.525c0 489.6-424.207 719.774-733.779 887.943l-34.899 18.975c-8.47 4.517-17.731 6.889-27.105 6.889Zm467.158-547.652h-313.412l-91.595-91.482v-83.803H905.041v-116.78h-83.69l-58.503-58.504c-1.92.113-3.84.113-5.76.113-176.075 0-319.285-143.21-319.285-319.285s143.21-319.398 319.285-319.398 319.285 143.323 319.285 319.398c0 1.92 0 3.84-.113 5.647l350.57 350.682zm-266.654-112.941h153.713v-153.713L958.462 750.155l3.953-37.27c1.017-123.897-91.595-216.621-205.327-216.621S550.744 588.988 550.744 702.72c0 113.845 92.612 206.344 206.344 206.344l47.21-5.309 63.811 63.7h149.873v116.78h116.781v149.986zm-313.4-553.57c0 46.758-37.949 84.706-84.706 84.706s-84.706-37.948-84.706-84.706 37.948-84.706 84.706-84.706c46.757 0 84.706 37.948 84.706 84.706" />
    </svg>
  ),

  Attach: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="800" height="800"
      viewBox="0 0 20 20"
      fill="currentColor"
      stroke="currentColor"
      aria-label="Attach media"
    >
      <path d="m13.946 9.02-5.45 5.449c-1.333 1.34-3.113 1.223-4.262.066-1.158-1.143-1.26-2.915.073-4.256L11.8 2.787c.74-.74 1.874-.93 2.629-.183.754.761.556 1.882-.183 2.622l-7.412 7.426c-.257.257-.55.184-.733.015a.504.504 0 0 1 .022-.725l5.164-5.156c.322-.33.33-.813.022-1.128a.8.8 0 0 0-1.128.022l-5.186 5.185c-.857.865-.813 2.198-.044 2.967.828.827 2.088.813 2.952-.052l7.463-7.456c1.502-1.509 1.465-3.493.125-4.834C14.18.18 12.158.106 10.65 1.607l-7.544 7.56c-1.941 1.947-1.831 4.76-.044 6.547 1.787 1.78 4.6 1.897 6.548-.037l5.493-5.493c.307-.307.307-.879-.015-1.18-.3-.321-.82-.3-1.142.016" />
    </svg>
  ),

  Email: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),

  Lock: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),

  Eye: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),

  EyeOff: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),

  X: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),

  AlertCircle: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),

  XCircle: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),

  ArrowRight: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),

  Spinner: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ),

  User: (props: IconProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),

};
