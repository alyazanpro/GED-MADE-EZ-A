type IconProps = {
  className?: string;
  title?: string;
};

/** Engraved / line-art open book with geometric ornament */
export function OrnateBookOpen({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M32 14c-6.5-4.2-14.2-5.8-22-5.2v36.4c8.2-.6 16.2 1.1 22 5.4 5.8-4.3 13.8-6 22-5.4V8.8C46.2 8.2 38.5 9.8 32 14Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M32 14v36.6" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      {/* spine filigree */}
      <path
        d="M32 18.5c2.2 1.6 2.2 4.2 0 5.8-2.2-1.6-2.2-4.2 0-5.8Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d="M32 28.5c2.2 1.6 2.2 4.2 0 5.8-2.2-1.6-2.2-4.2 0-5.8Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d="M32 38.5c2.2 1.6 2.2 4.2 0 5.8-2.2-1.6-2.2-4.2 0-5.8Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* page lines + corner ornaments */}
      <path
        d="M16.5 19.2c3.6-.5 7.2.3 10.2 2M16.5 24.2c3.8-.5 7.5.2 10.7 2.1M16.5 29.2c3.5-.4 7.1.3 10.1 1.9M16.5 34.2c3.2-.4 6.6.2 9.5 1.7"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M47.5 19.2c-3.6-.5-7.2.3-10.2 2M47.5 24.2c-3.8-.5-7.5.2-10.7 2.1M47.5 29.2c-3.5-.4-7.1.3-10.1 1.9M47.5 34.2c-3.2-.4-6.6.2-9.5 1.7"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M14.8 40.5c1.8 1.2 3.8 1.2 5.6 0M43.6 40.5c1.8 1.2 3.8 1.2 5.6 0"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* crest */}
      <path
        d="M32 9.8c2-1.6 4.8-1.8 7-.7-2.7.2-5 1.2-7 2.8-2-1.6-4.3-2.6-7-2.8 2.2-1.1 5-.9 7 .7Z"
        fill="currentColor"
        opacity="0.92"
      />
      <circle cx="32" cy="7.6" r="1.5" fill="currentColor" />
      <path
        d="M25.5 7.6h13"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Closed tome with embossed diamond + corner flourishes */
export function OrnateBookClosed({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M16 10.5h28.5c2.2 0 4 1.8 4 4v35c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4v-35c0-2.2 1.8-4 4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 14.5h4.5M12 49.5h4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22 20h18M22 44h18"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M32 24.5 36.8 32 32 39.5 27.2 32 32 24.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M32 28.2 34.5 32 32 35.8 29.5 32 32 28.2Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.8"
      />
      <path
        d="M20.5 18.5c1.2-1.4 2.8-1.4 4 0M39.5 18.5c-1.2-1.4-2.8-1.4-4 0M20.5 45.5c1.2 1.4 2.8 1.4 4 0M39.5 45.5c-1.2 1.4-2.8 1.4-4 0"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="32" cy="32" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Stacked books with ornamental bands */
export function OrnateBookStack({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M12 42.5h40c1.5 0 2.5 1.3 2.2 2.7l-1.4 6.3c-.3 1.2-1.3 2-2.5 2H13.7c-1.2 0-2.2-.8-2.5-2L9.8 45.2c-.3-1.4.7-2.7 2.2-2.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14 31.5h36c1.5 0 2.5 1.3 2.2 2.7l-1 4.5c-.3 1.2-1.3 2-2.5 2H15.3c-1.2 0-2.2-.8-2.5-2l-1-4.5c-.3-1.4.7-2.7 2.2-2.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 20.5h32c1.5 0 2.5 1.3 2.2 2.7l-1 4.5c-.3 1.2-1.3 2-2.5 2H17.3c-1.2 0-2.2-.8-2.5-2l-1-4.5c-.3-1.4.7-2.7 2.2-2.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M20 23.8h7M37 23.8h7M18 34.8h8M38 34.8h8M16 46.5h10M38 46.5h10"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M32 16.5c2.4-2.2 6.2-2.2 8.6 0-2.8.1-5.2 1-8.6 3.2-3.4-2.2-5.8-3.1-8.6-3.2 2.4-2.2 6.2-2.2 8.6 0Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="14.8" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** Quill over open manuscript — scholarship motif */
export function OrnateQuillBook({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M10 44.5c8.5-1 16.8 1.2 22 5.5 5.2-4.3 13.5-6.5 22-5.5V18.2C45.5 17.2 37.2 19.2 32 23.5c-5.2-4.3-13.5-6.3-22-5.3v26.3Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
      <path d="M32 23.5v26.5" stroke="currentColor" strokeWidth="1.45" />
      <path
        d="M42 14.5c4.5 3.8 7.2 9.2 7.8 15.2-2.8-2.4-5.4-3.6-8.5-4.2 1.2-3.8 1.2-7.6.7-11Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M42.2 14.8 49.5 29.5"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M17 28h8.5M17 33h10M17 38h7"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M32 12.5c1.5-1.2 3.6-1.3 5.2-.4-2 .2-3.7.9-5.2 2.1-1.5-1.2-3.2-1.9-5.2-2.1 1.6-.9 3.7-.8 5.2.4Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

/** Small brand mark: book + diamond crest */
export function OrnateBookMark({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="5"
        y="5"
        width="30"
        height="30"
        rx="9"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <path
        d="M12 13.2c4.2-.6 8.2.8 10 3.6 1.8-2.8 5.8-4.2 10-3.6v14.8c-4.4-.5-8.4 1-10 3.8-1.6-2.8-5.6-4.3-10-3.8V13.2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M22 16.8v14.8" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M20 11.2 21.6 13.5 20 15.8 18.4 13.5 20 11.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
