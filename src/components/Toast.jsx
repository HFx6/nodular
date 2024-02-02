import { useEffect } from "react";
import toast, { Toaster, useToasterStore } from "react-hot-toast";

const ToasterComponent = () => {
	const { toasts } = useToasterStore();
	const TOAST_LIMIT = 5;

	useEffect(() => {
		toasts
			.filter((t) => t.visible) // Only consider visible toasts
			.filter((_, i) => i >= TOAST_LIMIT) // Is toast index over limit?
			.forEach((t) => toast.dismiss(t.id)); // Dismiss – Use toast.remove(t.id) for no exit animation
	}, [toasts]);

	return (
		<Toaster
			maxCount={1}
			position="bottom-right"
			reverseOrder={false}
			toastOptions={{
				className: "",
				style: {
					borderRadius: "10px",
					background: "#333",
					color: "#fff",
				},
			}}
		/>
	);
};

export default ToasterComponent;
