/** The waiting/empty line shared by the sink built-ins (#9).
 *
 *  A sink has two different empty states and they should not look alike: an
 *  unwired port is genuinely empty and stays still, while a wired port whose
 *  value hasn't arrived is loading and gets a spinner. The engine publishes a
 *  key for every incoming edge, so the presence of the port name in the
 *  resolved inputs is exactly "is something wired to it". */
export function Waiting({
  msg,
  busy,
  bad,
}: {
  msg: string;
  busy?: boolean;
  bad?: boolean;
}) {
  return (
    <div className={`bihint${busy ? " wait" : ""}${bad ? " bad" : ""}`}>
      {busy && <span className="spinner" />}
      {msg}
    </div>
  );
}
