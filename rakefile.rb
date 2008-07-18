task :default => [:xpi]

task :xpi do
  rm_f 'mixbar.xpi'
  `find chrome chrome.manifest install.rdf -type f \
   | egrep -v "(#|~)" | xargs zip mixbar.xpi`
end 
