import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';

export class UpdateMenuDto extends PartialType(
  OmitType(CreateMenuDto, [] as const),
) {}
