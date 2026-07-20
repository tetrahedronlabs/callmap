const Footer = () => {
	return (
		<div className="mx-auto max-w-screen-xl">
			<hr className="border-slate-200" />
			<div className="flex items-center justify-between py-4">
				<a href="https://tetrahedron.dev" className="text-sm text-gray-500">
					© {new Date().getFullYear()} Tetrahedron Labs
				</a>
				<a
					href="https://status.tetrahedron.dev"
					className="text-sm text-gray-500"
				>
					System status
				</a>
			</div>
		</div>
	);
};

export default Footer;
