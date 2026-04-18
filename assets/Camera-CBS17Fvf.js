var e=`/* Camera inner: origin must be (0,0) so that the translate+scale math in
   computeTransformToCenter (tx = cw/2 - cx*scale) places rect centers at
   container center. Origin itself is not a positioning mechanism — it only
   fixes the coordinate system. Positioning is done entirely via translate+scale. */
.camera-inner {
  transform-origin: 0 0;
}
`;export{e as default};