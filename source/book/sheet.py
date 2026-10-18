import sys,glob
from PIL import Image
files=sorted(glob.glob(sys.argv[1]+'/p-*.png'),key=lambda f:int(f.rsplit('-',1)[1][:-4]))
start=int(sys.argv[3]) if len(sys.argv)>3 else 0; cnt=int(sys.argv[4]) if len(sys.argv)>4 else 6
files=files[start:start+cnt]
ims=[Image.open(f) for f in files]
cols=3; w=ims[0].width; h=ims[0].height; rows=(len(ims)+cols-1)//cols
c=Image.new('RGB',(cols*w+(cols-1)*8,rows*h+(rows-1)*8),'#777')
for i,im in enumerate(ims): c.paste(im,((i%cols)*(w+8),(i//cols)*(h+8)))
c.save(sys.argv[2]); print(len(ims), c.size)
