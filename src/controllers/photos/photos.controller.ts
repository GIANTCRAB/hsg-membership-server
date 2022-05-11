import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { PhotoUploadsService } from '../../services/photo-uploads.service';

@Controller('api/photos')
export class PhotosController {
  constructor(private readonly photoUploadsService: PhotoUploadsService) {}

  @Get(':id/view')
  getPhotoImageUsingId(@Param() params, @Res() res): Observable<object> {
    return this.photoUploadsService.getSpecificPhotoById(params.id).pipe(
      map((photo) => {
        if (photo) {
          return res.sendFile(photo.filename, { root: 'photo-uploads' });
        }
        throw new NotFoundException([
          'Photo with such an ID could not be found.',
        ]);
      }),
    );
  }
}
