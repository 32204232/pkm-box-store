package com.pkm.store.domain.member.dto;

import com.pkm.store.domain.member.entity.Member;
import com.pkm.store.domain.member.type.MemberRole;
import java.time.LocalDateTime;

public record MemberResponse(
        Long id,
        String email,
        String name,
        String profileImageUrl,
        String bio,
        MemberRole role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getName(),
                member.getProfileImageUrl(),
                member.getBio(),
                member.getRole(),
                member.getCreatedAt(),
                member.getUpdatedAt()
        );
    }
}
