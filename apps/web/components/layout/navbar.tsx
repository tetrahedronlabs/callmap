import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const Navbar = () => {
	const [scroll, setScroll] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			setScroll(window.scrollY);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<>
			<nav
				className={`fixed left-0 right-0 top-0 z-50 h-14 bg-slate-50 transition duration-300 dark:bg-slate-900 ${scroll < 50 ? 'bg-opacity-0 dark:bg-opacity-0' : 'border-b bg-opacity-70 backdrop-blur-md duration-500'}`}
			/>
			<nav className="fixed left-0 right-0 top-0 z-50 mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-2">
				<Link to="/" className="text-3xl font-semibold text-primary">
					CallMap
				</Link>
			</nav>
		</>
	);
};

export default Navbar;
