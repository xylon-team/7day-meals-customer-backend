import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';


@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getProfile(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { customer_id: id },
      include: {
        customer_credential: {
          select: { email: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.is_deleted) {
      throw new NotFoundException('Customer profile has been deleted');
    }

    return customer;
  }

  async updateProfile(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { customer_id: id },
    });

    if (!customer || customer.is_deleted) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({
      where: { customer_id: id },
      data: updateCustomerDto,
    });
  }

  async deleteProfile(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { customer_id: id },
    });

    if (!customer || customer.is_deleted) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({
      where: { customer_id: id },
      data: {
        is_deleted: true,
        is_active: false,
        delete_timestamp: new Date(),
      },
    });
  }

  async registerCustomer(createCustomerDto: CreateCustomerDto) {
    const { fname, lname, phone_number, email, password, latitude, longitude, address_line_1, address_line_2 } = createCustomerDto;

    const existingCredential = await this.prisma.customer_credential.findFirst({
      where: { email },
    });

    if (existingCredential) {
      throw new ConflictException('Email is already registered');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          fname,
          lname,
          phone_number,
          latitude,
          longitude,
          address_line_1,
          address_line_2,
        },
      });

      await tx.customer_credential.create({
        data: {
          customer_id: customer.customer_id,
          email,
          customer_password: password,
        },
      });

      return {
        customer_id: customer.customer_id,
        fname: customer.fname,
        lname: customer.lname,
        phone_number: customer.phone_number,
        email,
        registration_date: customer.registration_date,
      };
    });
  }
}
