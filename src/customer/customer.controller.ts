import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  registerCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.registerCustomer(createCustomerDto);
  }

  @Get(':id')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getProfile(id);
  }

  @Patch(':id')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.updateProfile(id, updateCustomerDto);
  }

  @Delete(':id')
  deleteProfile(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.deleteProfile(id);
  }
}
