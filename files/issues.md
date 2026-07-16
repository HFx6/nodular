1. should we have specific node types for things like table sor text or should it be a generic with the settings giving us options to change the rendering type e.g. we have a node that can eval and renders as table or do we have a table node that tables in data somehow - the user has to define the rows somehow and it might make node managment and creation easier?

2. the trigger for edge hover should be a bit larger since its so small it can glitch out

3. on hover the edge label should be above everthing so its always visible - also we should dim all other nodes and have the two connected nodes normal after 3s of hover

4. the out and in text is the same color as the edges and is hard to see

5. we should have some edge effects for colors or status effects between nodes

6. the eval/code nodes have bad views of the code because of when panning or trying to scorll the focus is trapped in there, also its so small its not useable - perhaps we could show it if its a small snippet but do soem code mirror logic to only show the larger classes/functions collapsed 

7. double click to open the editor

8. editor has no proper syntax highlighting

9. editor controls like prettier - linting etc

10. better visual of the values form the in/out

11. more canvas controls for things like width/height/aspect ratio? the nes is a bit squshed but i think it has the aspect ratio or pixel/pixel stated in the code as the riginal evrsion used it

12. we need a better way to store examples in the code rather than groupped in folders as a tsx maybe it should be json files? - and a proper loader instead of just importing into the app.tsx

12. dragging if clicking on or letting go on a button in the node causes it to open

13. better placement of node header and footer items

14. while dragging the cursor can go fadter than the node so the cursor changes between different pointer types which looks bad

15. dragging ndoes can be a bit delayed

16. we should probably add some animtions to things using animejs or motion

17. editor needs to be drag resizeable

18. clicking on new node shouldnt just make it until i click on the screen and then it creates it there