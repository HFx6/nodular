import { useEffect, useMemo } from "react";
import { Handle, useReactFlow, useUpdateNodeInternals } from "reactflow";
import "./CodeNode.css";
import {
	PiPlayFill,
	PiDotsThreeOutlineFill,
	PiSpinnerGapDuotone,
} from "react-icons/pi";
import {
	Menu,
	MenuArrow,
	MenuArrowTip,
	MenuContent,
	MenuContextTrigger,
	MenuItem,
	MenuItemGroup,
	MenuItemGroupLabel,
	MenuOptionItem,
	MenuPositioner,
	MenuSeparator,
	MenuTrigger,
	MenuTriggerItem,
	Portal,
} from "@ark-ui/react";
import { onPlay } from "../../utils/play";

function CanvasNode() {
	const data = { lang: "canvas" };

	return (
		<div className={`${data.lang}-code-container ${data.lang}-node`}>
			<div className={`${data.lang}-code-header`}>
				<div className={`${data.lang}-code-info`}>
					<div className={`${data.lang}-code-icon`}>
						<PiSpinnerGapDuotone />
					</div>
					<div className={`${data.lang}-code-name`}>{data.label}</div>
				</div>
				<div
					className={`${data.lang}-code-options ignore-double-click nodrag`}
				>
					<div
						className={`${data.lang}-code-play`}
						onClick={(e) => onPlay(e, id)}
					>
						{data.loading ? (
							<PiSpinnerGapDuotone className="spinner" />
						) : (
							<PiPlayFill />
						)}
					</div>
					<div className={`${data.lang}-code-more`}>
						<Menu>
							<MenuTrigger>
								<PiDotsThreeOutlineFill />
							</MenuTrigger>
							<Portal>
								<MenuPositioner>
									<MenuContent>
										<MenuItem id="edit">Edit</MenuItem>
										<MenuItem id="delete">Delete</MenuItem>
									</MenuContent>
								</MenuPositioner>
							</Portal>
						</Menu>
					</div>
				</div>
			</div>
			<div className={`${data.lang}-code-body`}>
				<canvas className="rounded"></canvas>

				<div style={{display: "none"}}>
					<section className="px-5 py-4">
						<div className="text-center text-white">
							<h1>
								<b>Welcome to Chippy!</b>
							</h1>
							<h3 id="fpsControl">
								FPS: <span id="fpsCounter"></span>
							</h3>
						</div>
					</section>

					<section>
						<div className="d-flex flex-lg-row flex-column justify-content-center">
							<div className="px-lg-5 px-0"></div>
							<div id="debugPanel" className="col-sm px-5">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">Registers</h5>
									<div className="card-body">
										<div className="d-flex justify-content-around registers">
											<div className="d-flex flex-column">
												<div className="d-flex">
													<div>PC--</div>
													<div id="PC">0x--</div>
												</div>
												<div className="d-flex">
													<div>I--</div>
													<div id="I">0x--</div>
												</div>
												<div className="d-flex">
													<div>DT--</div>
													<div id="DT">0x--</div>
												</div>
												<div className="d-flex">
													<div>ST--</div>
													<div id="ST">0x--</div>
												</div>
											</div>

											<div className="d-flex flex-column">
												<div className="d-flex">
													<div>V0--</div>
													<div id="V0">0x--</div>
												</div>
												<div className="d-flex">
													<div>V1--</div>
													<div id="V1">0x--</div>
												</div>
												<div className="d-flex">
													<div>V2--</div>
													<div id="V2">0x--</div>
												</div>
												<div className="d-flex">
													<div>V3--</div>
													<div id="V3">0x--</div>
												</div>
												<div className="d-flex">
													<div>V4--</div>
													<div id="V4">0x--</div>
												</div>
												<div className="d-flex">
													<div>V5--</div>
													<div id="V5">0x--</div>
												</div>
												<div className="d-flex">
													<div>V6--</div>
													<div id="V6">0x--</div>
												</div>
												<div className="d-flex">
													<div>V7--</div>
													<div id="V7">0x--</div>
												</div>
												<div className="d-flex">
													<div>V8--</div>
													<div id="V8">0x--</div>
												</div>
												<div className="d-flex">
													<div>V9--</div>
													<div id="V9">0x--</div>
												</div>
												<div className="d-flex">
													<div>VA--</div>
													<div id="V10">0x--</div>
												</div>
												<div className="d-flex">
													<div>VB--</div>
													<div id="V11">0x--</div>
												</div>
												<div className="d-flex">
													<div>VC--</div>
													<div id="V12">0x--</div>
												</div>
												<div className="d-flex">
													<div>VD--</div>
													<div id="V13">0x--</div>
												</div>
												<div className="d-flex">
													<div>VE--</div>
													<div id="V14">0x--</div>
												</div>
												<div className="d-flex">
													<div>VF--</div>
													<div id="V15">0x--</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
					<section>
						<div className="container d-flex justify-content-center align-items-center">
							<div className="m-4">
								<div className="form-check form-check-inline">
									<label
										className="form-check-label text-white"
										htmlFor="debug"
									>
										Debug
									</label>
									<input
										className="form-check-input"
										type="checkbox"
										defaultValue=""
										id="debug"
									/>
								</div>
							</div>
							<div className="my-2">
								<button
									className="btn btn-primary"
									data-bs-toggle="modal"
									data-bs-target="#exampleModal"
									data-bs-placement="left"
									data-bs-animation="true"
									title="Open Settings"
								>
									<i className="bi bi-sliders"></i>
								</button>
							</div>
						</div>
					</section>

					<section className="px-5 py-4">
						<div className="row gy-4">
							<div className="col-sm d-flex justify-content-center">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">
										Rom Selection
									</h5>
									<div className="card-body">
										<button
											className="btn btn-primary btn-block w-100"
											id="load"
											type="button"
											defaultValue="load"
											data-bs-toggle="tooltip"
											data-bs-placement="left"
											data-bs-animation="true"
											title="Loads or Reloads the selected rom from the drop down"
										>
											Load
										</button>

										<div className="m-4">
											<h6>Rom Selection</h6>
											<select
												className="form-select"
												id="roms"
											></select>
										</div>

										<button
											disabled
											className="btn btn-primary btn-block w-100"
											id="load"
											type="button"
											defaultValue="load"
											data-bs-toggle="tooltip"
											data-bs-placement="left"
											data-bs-animation="true"
											title="Loads a selected rom from file"
										>
											Select File
										</button>
									</div>
								</div>
							</div>

							<div className="col-sm d-flex justify-content-center">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">
										CPU Controls
									</h5>
									<div className="card-body">
										<button
											className="btn btn-primary btn-block w-100 mb-2"
											id="pause"
											type="button"
											defaultValue="pause"
											data-bs-toggle="tooltip"
											data-bs-placement="left"
											data-bs-animation="true"
											title="Pauses the emulator"
										>
											Pause
										</button>

										<button
											className="btn btn-primary btn-block w-100"
											id="step"
											type="button"
											defaultValue="Step"
											data-bs-toggle="tooltip"
											data-bs-placement="left"
											data-bs-animation="true"
											title="Steps the CPU to the next Instruction"
										>
											Step
										</button>

										<div className="m-4">
											<h6>Instructions Per CPU cycle</h6>
											<input
												className="form-control rounded text-center"
												id="speedStep"
												type="number"
												data-bs-toggle="tooltip"
												data-bs-placement="left"
												data-bs-animation="true"
												title="Handles the instructions per cpu cycle"
											/>
										</div>
										<div className="m-4">
											<h6>Instruction Quirks</h6>
										</div>
										<div className="m-4">
											<select
												className="form-select"
												id="quirkType"
												data-bs-toggle="tooltip"
												data-bs-placement="left"
												data-bs-animation="true"
												title="Handles shift quirk and load quirk depending on CPU selection"
											>
												<option>No Quirk</option>
												<option>
													Shift and Load Qurk
												</option>
												<option>
													Shift Quirk Only
												</option>
											</select>
										</div>
									</div>
								</div>
							</div>

							<div className="col-sm d-flex justify-content-center">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">
										Rom Instructions
									</h5>
									<div className="card-body"></div>
								</div>
							</div>
						</div>
					</section>

					<section id="debugPanel" className="px-5 pb-4">
						<div className="row gy-3">
							<div className="col-sm d-flex justify-content-center">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">
										Debug Options
									</h5>
									<div className="card-body">
										<div className="form-check form-check-inline">
											<label
												className="form-check-label"
												htmlFor="showfps"
											>
												Show FPS
											</label>
											<input
												className="form-check-input"
												type="checkbox"
												defaultValue=""
												id="showfps"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="col-sm d-flex justify-content-center">
								<div
									className="card text-center w-100"
								>
									<h5 className="card-header">Registers</h5>
									<div className="card-body">
										<div className="d-flex justify-content-around registers">
											<div className="d-flex flex-column">
												<div className="d-flex">
													<div>PC--</div>
													<div id="PC">0x--</div>
												</div>
												<div className="d-flex">
													<div>I--</div>
													<div id="I">0x--</div>
												</div>
												<div className="d-flex">
													<div>DT--</div>
													<div id="DT">0x--</div>
												</div>
												<div className="d-flex">
													<div>ST--</div>
													<div id="ST">0x--</div>
												</div>
											</div>

											<div className="d-flex flex-column">
												<div className="d-flex">
													<div>V0--</div>
													<div id="V0">0x--</div>
												</div>
												<div className="d-flex">
													<div>V1--</div>
													<div id="V1">0x--</div>
												</div>
												<div className="d-flex">
													<div>V2--</div>
													<div id="V2">0x--</div>
												</div>
												<div className="d-flex">
													<div>V3--</div>
													<div id="V3">0x--</div>
												</div>
												<div className="d-flex">
													<div>V4--</div>
													<div id="V4">0x--</div>
												</div>
												<div className="d-flex">
													<div>V5--</div>
													<div id="V5">0x--</div>
												</div>
												<div className="d-flex">
													<div>V6--</div>
													<div id="V6">0x--</div>
												</div>
												<div className="d-flex">
													<div>V7--</div>
													<div id="V7">0x--</div>
												</div>
												<div className="d-flex">
													<div>V8--</div>
													<div id="V8">0x--</div>
												</div>
												<div className="d-flex">
													<div>V9--</div>
													<div id="V9">0x--</div>
												</div>
												<div className="d-flex">
													<div>VA--</div>
													<div id="V10">0x--</div>
												</div>
												<div className="d-flex">
													<div>VB--</div>
													<div id="V11">0x--</div>
												</div>
												<div className="d-flex">
													<div>VC--</div>
													<div id="V12">0x--</div>
												</div>
												<div className="d-flex">
													<div>VD--</div>
													<div id="V13">0x--</div>
												</div>
												<div className="d-flex">
													<div>VE--</div>
													<div id="V14">0x--</div>
												</div>
												<div className="d-flex">
													<div>VF--</div>
													<div id="V15">0x--</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
					<div
						className="modal fade"
						id="exampleModal"
						tabIndex="-1"
						aria-labelledby="exampleModalLabel"
						aria-hidden="true"
					>
						<div className="modal-dialog">
							<div className="modal-content color-granite-gray">
								<div className="modal-header">
									<h3
										className="modal-title text-white"
										id="exampleModalLabel"
									>
										<b>Settings</b>
									</h3>
									<button
										type="button"
										className="btn-close"
										data-bs-dismiss="modal"
										aria-label="Close"
									></button>
								</div>
								<div className="modal-body p-5">
									<section>
										<div className="row gy-3">
											<div className="col-sm d-flex justify-content-center">
												<div
													className="card text-center w-100"
												>
													<h5 className="card-header">
														Display Controls
													</h5>
													<div className="card-body">
														<div className="m-4">
															<h6>
																Display Scale
															</h6>
															<input
																className="form-control rounded text-center"
																id="displayScale"
																type="number"
																data-bs-toggle="tooltip"
																data-bs-placement="left"
																data-bs-animation="true"
																title="Scales the display"
															/>
														</div>
														<div className="m-4">
															<div className="d-flex align-items-end justify-content-around">
																<label
																	htmlFor="bgColor"
																	className="form-label"
																>
																	Background
																	Color
																</label>
																<input
																	type="color"
																	className="form-control form-control-color"
																	id="bgColor"
																/>
															</div>
														</div>
														<div className="m-4">
															<div className="d-flex align-items-end justify-content-around">
																<label
																	htmlFor="color"
																	className="form-label"
																>
																	Foreground
																	Color
																</label>
																<input
																	type="color"
																	className="form-control form-control-color"
																	id="color"
																/>
															</div>
														</div>
													</div>
												</div>
											</div>

											<div className="col-sm d-flex justify-content-center">
												<div
													className="card text-center w-100"
												>
													<h5 className="card-header">
														Sound Controls
													</h5>
													<div className="card-body">
														<div className="m-4">
															<div className="form-check form-check-inline">
																<label
																	className="form-check-label"
																	htmlFor="sound"
																>
																	Mute
																</label>
																<input
																	className="form-check-input"
																	type="checkbox"
																	defaultValue=""
																	id="sound"
																/>
															</div>
														</div>

														<div className="m-4">
															<h6>
																Volume Control
																<span id="volumeNumber"></span>
															</h6>
															<input
																className="form-range rounded"
																id="volumeControl"
																type="range"
																step="0.01"
																defaultValue="0.01"
																min="0"
																max="1"
															/>
														</div>
														<div className="m-4">
															<h6>
																Oscillator Type
															</h6>
															<select
																className="form-select"
																id="oscillator"
															>
																<option>
																	sine
																</option>
																<option>
																	square
																</option>
																<option>
																	sawtooth
																</option>
																<option>
																	triangle
																</option>
															</select>
														</div>
													</div>
												</div>
											</div>
										</div>
									</section>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default CanvasNode;
