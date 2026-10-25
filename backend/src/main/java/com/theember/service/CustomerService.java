package com.theember.service;

import com.theember.dto.UserProfileUpdateRequest;
import com.theember.entity.Address;
import com.theember.entity.User;
import com.theember.repository.AddressRepository;
import com.theember.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    public User getProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public User updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getProfile(userId);
        user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public List<Address> getAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Address addAddress(Long userId, Address newAddress) {
        User user = getProfile(userId);
        newAddress.setUser(user);

        if (Boolean.TRUE.equals(newAddress.getIsDefault())) {
            List<Address> defaults = addressRepository.findByUserIdAndIsDefaultTrue(userId);
            for (Address a : defaults) {
                a.setIsDefault(false);
                addressRepository.save(a);
            }
        }

        return addressRepository.save(newAddress);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized access to this address");
        }

        addressRepository.delete(address);
    }
}
