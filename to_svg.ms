-- Export Editable_Spline ? SVG (closed splines only)

fn writeFile txtfile content new:false = (
	local FileNum = if new or (not (doesfileexist txtfile)) then
		createfile txtfile
	else
		openFile txtfile mode:"a"
	
	if iskindof content array then
		for s in content do
			format "%\n" s to:FileNum
	else
		format "%\n" content to:FileNum
	
	close FileNum
)

fn exportEditableSplineToSVG splineObj filePath = (
  local svgHeader = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n<svg width=\"512\" height=\"512\" viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\">\r\n"
  local svgContent = ""
  local svgFooter = "</svg>"
  
  -- ?? Editable_Spline methods
  local num_Splines = numSplines splineObj
  print ("Found " + num_Splines as string + " splines")
  
  for splineID = 1 to num_Splines do (
    if isClosed splineObj splineID then (
      print ("Processing closed spline #" + splineID as string)
      
      local pointsStr = ""
      local num_Knots = numKnots splineObj splineID
      for knotID = 1 to num_Knots do (
        local knotPos = getKnotPoint splineObj splineID knotID
        -- Normalize -256..256 ? SVG 0..512 + Y flip
        local svgX = ((knotPos.x / 512.0) + 0.5) * 512.0
        local svgY = (1.0 - (knotPos.y / 512.0)) * 512.0
        
        pointsStr += (svgX as string) + "," + (svgY as string)
        if knotID < num_Knots do pointsStr += " "
      )
      
      svgContent += "<path d=\"M " + pointsStr + " Z\" fill=\"none\" stroke=\"#000\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\\r\n"
    ) else (
	  -- ?? OPEN SPLINE: Không Z, ch? L commands
	  print ("Processing OPEN spline #" + splineID as string)
	  
	  local pointsStr = ""
	  local num_Knots = numKnots splineObj splineID
	  for knotID = 1 to num_Knots do (
		local knotPos = getKnotPoint splineObj splineID knotID
		local svgX = ((knotPos.x / 512.0) + 0.5) * 512.0
		local svgY = (1.0 - (knotPos.y / 512.0)) * 512.0
		
		if knotID == 1 then (
		  pointsStr += "M " + (svgX as string) + "," + (svgY as string)  -- Move to first
		) else (
		  pointsStr += " L " + (svgX as string) + "," + (svgY as string)  -- Line to next
		)
	  )
	  
	  svgContent += "<path d=\"" + pointsStr + "\" fill=\"none\" stroke=\"#000\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\r\n"
	)
  )
  
  local fullSVG = svgHeader + svgContent + svgFooter
  local success = writeFile filePath fullSVG new:true
  print ("? SVG saved: " + filePath + " (" + (num_Splines as string) + " splines processed)")
)

-- RUN:
if selection.count == 1 and classOf selection[1] == SplineShape then (
  exportEditableSplineToSVG selection[1] @"C:\temp\editable_spline.svg"
  print "?? DONE!"
) else (
  print "? Ch?n 1 Editable_Spline object!"
)
