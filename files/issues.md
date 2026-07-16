1. much like natto, we should have things collapsible in the node, so example when the function output is on the right we can have mutliple if there are say 5 functions or large functions that would make the function scroll

they should still be stacked on the right rather than match the position of the funciton to accomidate this however OR should we have a limit on chars shown? whats cleaner and better UX

STATUS: open — plan: keep the stacked column, add a char limit (~110px + ellipsis, full name on hover) and collapse beyond ~6 exports into a "· n more" toggle row.

2. ~~why is the node footer min-height: 26px~~ RESOLVED — the min-height was a mockup artifact; the value strip now renders only when there's a value or an error.
3. ~~we dont need it to say "no vlaue - something something" either rmeove it or have something worhwhile being there - (what does natto do?)~~ RESOLVED — natto shows nothing when there's nothing to show; the strip is now conditional (value · kind, or the error in red).
4. ~~we should be able to copy the natto dev art browser demo which fetchs and has the table and is clickable~~ RESOLVED — engine v0 runs it for real: menu → examples → art browser (fetch → table → image url → image).
