import "./style.css";

export default function Base({ label, type, children }) {
	
		return (
			<div className="basenode-container">
				<div className={`basenode-header ${type}`}>
					<div className="basenode-label">{label}</div>
					<div className="basenode-icon">@</div>
				</div>
				<div className="basenode-content">{children}</div>
			</div>
		);
}
