import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiBearerAuth('access-token')
@ApiTags('brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly service: BrandService) {}
  
   

  @Get()
//   @Permissions('view_brand')
  async list(@Query('q') q?:string){
   return this.service.list(q)
  }

//   @Get(':id')
// //   @Permissions('view_brand')
//    async detail( @Param('id') id:number){
//     const data= await this.service.detail(id)
//     return{ data}

//     }

    @Post()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions('create_brand')
@UseInterceptors(
  FileInterceptor('logo', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/brands';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }),
)
async create(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: CreateBrandDto,
) {
  if (file) {
    dto.logo_url = `/uploads/brands/${file.filename}`; // thêm field logo_url
  }
  return this.service.create(dto);
}


   @Put(':id')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions('update_brand')
@UseInterceptors(
  FileInterceptor('logo', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/brands';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }),
)
async update(
  @Param('id') id: number,
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UpdateBrandDto,
) {
  if (file) {
    dto.logo_url = `/uploads/brands/${file.filename}`; // cập nhật logo mới nếu có
  }

  const data = await this.service.update(id, dto);
  return data;
}


    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)

    @Permissions('delete_brand')
    async remove ( @Param('id') id:number){
        await this.service.remove(id)
        return id
    }
@Get(':brandId/products')
  async getProductsByBrand(@Param('brandId') brandId: number) {
    const products = await this.service.findProductsByBrand(brandId);
    return {
      message: products.length
        ? `Lấy danh sách sản phẩm của brand ${brandId} thành công`
        : 'Brand này chưa có sản phẩm',
      total: products.length,
      data: products,
    };
  }

@Get(':brandId/categories')
  async getCategoriesByBrand(@Param('brandId', ParseIntPipe) brandId: number) {
    const categories = await this.service.findCategoriesByBrand(brandId);
    return {
      message: categories.length
        ? `Lấy danh sách category của brand ${brandId} thành công`
        : 'Brand này chưa có category',
      total: categories.length,
      data: categories,
    };
  }

}