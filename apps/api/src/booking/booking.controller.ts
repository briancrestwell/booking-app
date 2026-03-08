import {
  Body, Controller, Get, Param,
  ParseUUIDPipe, Patch, Post, UseGuards, UsePipes,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto, CreateBookingSchema,
  UpdateBookingDto, UpdateBookingSchema,
} from './booking.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateBookingSchema))
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.bookingService.createBooking(dto, user.id);
  }

  @Get('my')
  findMine(@CurrentUser() user: { id: string }) {
    return this.bookingService.findByUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateBookingSchema)) dto: UpdateBookingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.bookingService.updateBooking(id, dto, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.bookingService.cancelBooking(id, user.id);
  }
}
