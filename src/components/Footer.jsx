import React from 'react';


export default function Footer() {
return (
<footer className="bg-dark text-white py-2 text-center">
<small>&copy; {new Date().getFullYear()} VisTrack. All rights reserved.</small>
</footer>
);
}